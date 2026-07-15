import 'dotenv/config'

import { readFile } from 'node:fs/promises'

import { parse } from 'csv-parse/sync'

import { pool, initDatabase } from './db'

interface BookRow {
  book_id: string
  title: string
  author: string
  description: string
  genres: string
  first_publish_year: string
  edition: string
  num_pages: string
}

const ignoredWords = [
  'coloring',
  'calendar',
  'journal',
  'workbook',
  'study guide',
  'trivia',
  'cookbook',
  'box set',
  'collection',
  'bundle',
  'film comic',
  'comic'
]

function shouldIgnore(title: string): boolean {
  const lower = title.toLowerCase()

  return ignoredWords.some((word) => lower.includes(word))
}

function parseGenres(raw: string): string[] {
  if (!raw) return []

  return raw
    .replace(/^\[/, '')
    .replace(/\]$/, '')
    .split(',')
    .map((g) => g.replace(/['"]/g, '').trim())
    .filter(Boolean)
    .filter((g) => g.toLowerCase() !== 'subject not available')
}

async function main() {
  await initDatabase()

  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const csv = await readFile('./src/data/books.csv', 'utf8')

    const books = parse<BookRow>(csv, {
      columns: true,
      skip_empty_lines: true,
      delimiter: '|'
    })

    const authorCache = new Map<string, number>()
    const genreCache = new Map<string, number>()
    const insertedBooks = new Set<string>()

    for (const row of books) {
      if (!row.book_id || !row.title || !row.author) continue

      if (shouldIgnore(row.title)) continue

      if (insertedBooks.has(row.book_id)) continue

      insertedBooks.add(row.book_id)

      //
      // AUTHOR
      //
      let authorId = authorCache.get(row.author)

      if (!authorId) {
        const existing = await client.query<{ id: number }>(
          `SELECT id FROM authors WHERE name = $1`,
          [row.author]
        )

        if (existing.rowCount) {
          authorId = existing.rows[0].id
        } else {
          const inserted = await client.query<{ id: number }>(
            `
            INSERT INTO authors(name)
            VALUES ($1)
            RETURNING id
            `,
            [row.author]
          )

          authorId = inserted.rows[0].id
        }

        authorCache.set(row.author, authorId)
      }

      //
      // BOOK
      //
      const insertedBook = await client.query<{ id: number }>(
        `
        INSERT INTO books (
            barcode,
            name,
            author_id,
            description,
            publish_year,
            edition,
            num_pages
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        ON CONFLICT (barcode) DO NOTHING
        RETURNING id
        `,
        [
          row.book_id,
          row.title,
          authorId,
          row.description || null,
          Number(row.first_publish_year) || null,
          Number(row.edition) || null,
          Number(row.num_pages) || null
        ]
      )

      if (!insertedBook.rowCount) continue

      const bookId = insertedBook.rows[0].id

      //
      // GENRES
      //
      for (const genre of parseGenres(row.genres)) {
        let genreId = genreCache.get(genre)

        if (!genreId) {
          const existing = await client.query<{ id: number }>(
            `SELECT id FROM genres WHERE name = $1`,
            [genre]
          )

          if (existing.rowCount) {
            genreId = existing.rows[0].id
          } else {
            const inserted = await client.query<{ id: number }>(
              `
              INSERT INTO genres(name)
              VALUES($1)
              RETURNING id
              `,
              [genre]
            )

            genreId = inserted.rows[0].id
          }

          genreCache.set(genre, genreId)
        }

        await client.query(
          `
          INSERT INTO book_genres(book_id, genre_id)
          VALUES ($1,$2)
          ON CONFLICT DO NOTHING
          `,
          [bookId, genreId]
        )
      }
    }

    await client.query('COMMIT')

    console.log('Database seeded successfully!')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(err)
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((err: unknown) => {
  console.log(err)
})
