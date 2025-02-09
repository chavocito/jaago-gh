import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
    ContainerRegistrationKeys,
} from "@medusajs/framework/utils"
import MarketplaceModuleService from "../../../modules/marketplace/service"
import { MARKETPLACE_MODULE } from "../../../modules/marketplace"
import { createProductsWorkflow } from "@medusajs/medusa/core-flows"
import {
    CreateProductWorkflowInputDTO,
    IProductModuleService,
    ISalesChannelModuleService,
} from "@medusajs/framework/types"
import {
    Modules,
} from "@medusajs/framework/utils"


type RequestType = CreateProductWorkflowInputDTO

export const POST = async (
    req: AuthenticatedMedusaRequest,
    res: MedusaResponse,
) => {
    const link = req.scope.resolve("link");
    const marketplaceModuleService: MarketplaceModuleService = req.scope.resolve(MARKETPLACE_MODULE);
    const productModuleService: IProductModuleService = req.scope.resolve(Modules.PRODUCT)
    const salesChannelModuleService: ISalesChannelModuleService = req.scope.resolve(Modules.SALES_CHANNEL)


    const salesChannels = await salesChannelModuleService.listSalesChannels()
    const vendorAdmin = await marketplaceModuleService.retrieveVendorAdmin(
        req.auth_context.actor_id,
        {
            relations: ["vendor"]
        }
    )

    const { result } = await createProductsWorkflow(req.scope)
        .run({
            input: {
                products: [{
                    ...req.body,
                    sales_channels: salesChannels,
                }],
            },
        })

    await link.create({
        [MARKETPLACE_MODULE]: {
            vendor_id: vendorAdmin.vendor.id,
        },
        [Modules.PRODUCT]: {
            product_id: result[0].id,
        },
    })
}


export const GET = async (
    req: AuthenticatedMedusaRequest,
    res: MedusaResponse
) => {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const marketplaceModuleService: MarketplaceModuleService =
        req.scope.resolve(MARKETPLACE_MODULE)

    const vendorAdmin = await marketplaceModuleService.retrieveVendorAdmin(
        req.auth_context.actor_id,
        {
            relations: ["vendor"],
        }
    )

    const { data: [vendor] } = await query.graph({
        entity: "vendor",
        fields: ["products.*"],
        filters: {
            id: [vendorAdmin.vendor.id],
        },
    })

    res.json({
        products: vendor.products,
    })
}