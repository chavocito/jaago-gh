import {
    AuthenticatedMedusaRequest,
    MedusaResponse
} from "@medusajs/framework";
import { MedusaError } from "@medusajs/utils";
import { z } from "zod";
import MarketplaceModuleService from "../../modules/marketplace/service";
import createVendorAdminWorkflow from "../../workflows/marketplace/create-vendor-admin";

const schema = z.object({
    name: z.string(),
    handle: z.string().optional(),
    logo: z.string().optional(),
    admin: z.object({
        email: z.string(),
        first_name: z.string().optional(),
        last_name: z.string().optional(),
    }).strict(),
}).strict()

type RequestBody = {
    name: string,
    handle?: string,
    logo?: string,
    admin: {
        email: string,
        first_name?: string,
        last_name?: string,
    }
}

export const POST = async (
    req: AuthenticatedMedusaRequest<RequestBody>,
    res: MedusaResponse,
) => {
    if (req.auth_context?.actor_id) {
        throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            "Request already authenticated as vendor"
        )
    }

    const  { admin, ...vendorData } = schema.parse(req.body) as RequestBody
    const marketplaceModuleService: MarketplaceModuleService = req.scope.resolve("marketplaceModuleService")
}