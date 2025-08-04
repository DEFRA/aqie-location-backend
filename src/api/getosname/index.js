import { osplaceController } from '~/src/api/getosname/controller/osplace.js'

const osnameplaces = {
  plugin: {
    name: 'osnameplaces',
    register: (server) => {
      server.route([
        {
          method: 'POST',
          path: '/osnameplaces',
          ...osplaceController
        }
      ])
    }
  }
}
export { osnameplaces }
