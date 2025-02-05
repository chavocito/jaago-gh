import MarketplaceModule from "../modules/marketplace";
import ProductModule from "@medusajs/medusa/product";
import { defineLink } from "@medusajs/framework/utils";

export default defineLink(
    MarketplaceModule.linkable.vendor,
    {
        linkable: ProductModule.linkable.product,
        isList: true
    }
)