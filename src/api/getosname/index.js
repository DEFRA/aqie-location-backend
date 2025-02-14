import { osplaceController } from '~/src/api/getosname/controller/osplace.js'

const osnameplaces = {
  plugin: {
    name: 'osnameplaces',
    register: (server) => {
      server.route([
        {
          method: 'GET',
          path: '/osnameplaces/userLocation={userLocation}',
          ...osplaceController
        }
      ])
    }
  }
}
export { osnameplaces }
