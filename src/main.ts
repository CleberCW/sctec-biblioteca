import 'dotenv/config'

import { NativeHttpService } from './@common/http/impl/native-http.service'
import { initDatabase } from './config/db'
import { BoxController } from './controllers/box.controller'
import { PokeApiController } from './controllers/poke-api.controller'
import { BoxFileRepository } from './repositories/box-file.repository'
import { BoxService } from './services/box.service'
import { PokeApiService } from './services/poke-api.service'
import { BoxView } from './views/box.view'
import { ExploreView } from './views/explore.view'
import { MenuView } from './views/menu.view'

initDatabase().catch((err: unknown) => {
  if (err instanceof Error) {
    console.error(err.message)
  } else {
    console.error('An unexpected error occurred', err)
  }
})

function bootstrap() {
  const boxService = new BoxService(new BoxFileRepository())
  const boxController = new BoxController(boxService)
  const pokeApiService = new PokeApiService(new NativeHttpService())
  const pokeApiController = new PokeApiController(pokeApiService)
  const boxView = new BoxView(boxController)
  const exploreView = new ExploreView(pokeApiController, boxController)

  const menuView = new MenuView(exploreView, boxView)

  return menuView.start()
}

bootstrap()
  .then(() => {
    process.exit(0)
  })
  .catch((e: unknown) => {
    console.log('UNHANDLED REJECTION')
    console.error(e)
    process.exit(1)
  })
