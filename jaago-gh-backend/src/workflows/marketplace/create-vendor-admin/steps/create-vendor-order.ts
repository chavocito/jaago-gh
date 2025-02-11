import {
    createStep,
    StepResponse,
} from "@medusajs/framework/workflows-sdk"
import {
    CartLineItemDTO,
    OrderDTO,
    LinkDefinition,
    InferTypeOf,
} from "@medusajs/framework/types"
import { Modules, promiseAll } from "@medusajs/framework/utils"
import {
    cancelOrderWorkflow,
    createOrderWorkflow,
} from "@medusajs/medusa/core-flows"
import MarketplaceModuleService from "../../../../modules/marketplace/service"
import { MARKETPLACE_MODULE } from "../../../../modules/marketplace"
import Vendor from "../../../../modules/marketplace/models/vendor"

export type VendorOrder = (OrderDTO & {
    vendor: InferTypeOf<typeof Vendor>
})

type StepInput = {
    parentOrder: OrderDTO
    vendorsItems: Record<string, CartLineItemDTO[]>
}

function prepareOrderData(
    items: CartLineItemDTO[],
    parentOrder: OrderDTO
) {
    // TODO format order data
    if (vendorIds.length === 1) {
        linkDefs.push({
          [MARKETPLACE_MODULE]: {
            vendor_id: vendors[0].id,
          },
          [Modules.ORDER]: {
            order_id: parentOrder.id,
          },
        })
      
        createdOrders.push({
          ...parentOrder,
          vendor: vendors[0],
        })
        
        return new StepResponse({
          orders:  createdOrders,
          linkDefs,
        }, {
          created_orders: [],
        })
      }
    
}

const createVendorOrdersStep = createStep(
    "create-vendor-orders",
    async (
        { vendorsItems, parentOrder }: StepInput,
        { container, context }
    ) => {
        const linkDefs: LinkDefinition[] = []
        const createdOrders: VendorOrder[] = []
        const vendorIds = Object.keys(vendorsItems)

        const marketplaceModuleService =
            container.resolve<MarketplaceModuleService>(MARKETPLACE_MODULE)

        const vendors = await marketplaceModuleService.listVendors({
            id: vendorIds,
        })

        // TODO create child orders
        if (vendorIds.length === 1) {
            linkDefs.push({
                [MARKETPLACE_MODULE]: {
                    vendor_id: vendors[0].id,
                },
                [Modules.ORDER]: {
                    order_id: parentOrder.id,
                },
            })

            createdOrders.push({
                ...parentOrder,
                vendor: vendors[0],
            })

            return new StepResponse({
                orders:  createdOrders,
                linkDefs,
            }, {
                created_orders: [],
            })
        }

        return new StepResponse({
            orders: createdOrders,
            linkDefs,
        }, {
            created_orders: createdOrders,
        })
    },
    async ({ created_orders }, { container, context }) => {
        // TODO add compensation function
        try {
            await promiseAll(
              vendorIds.map(async (vendorId) => {
                const items = vendorsItems[vendorId]
                const vendor = vendors.find((v) => v.id === vendorId)!
          
                const { result: childOrder } = await createOrderWorkflow(
                  container
                )
                .run({
                  input: prepareOrderData(items, parentOrder),
                  context,
                }) as unknown as { result: VendorOrder }
          
                childOrder.vendor = vendor
                createdOrders.push(childOrder)
                
                linkDefs.push({
                  [MARKETPLACE_MODULE]: {
                    vendor_id: vendor.id,
                  },
                  [Modules.ORDER]: {
                    order_id: childOrder.id,
                  },
                })
              })
            )
          } catch (e) {
            return StepResponse.permanentFailure(
              `An error occured while creating vendor orders: ${e}`,
              {
                created_orders: createdOrders,
              }
            )
          }
    }
)

export default createVendorOrdersStep