// noinspection TypeScriptValidateTypes

import {
    defineMiddlewares,
    authenticate, validateAndTransformBody,
} from "@medusajs/framework/http"
import {AdminCreateProduct} from "@medusajs/medusa/api/admin/products/validators";

export default defineMiddlewares({
    routes: [
        {
            matcher: "/vendors",
            method: "POST",
            middlewares: [
                authenticate("vendor", ["session", "bearer"], {
                    allowUnregistered: true,
                }),
            ],
        },
        {
            matcher: "/vendors/*",
            middlewares: [
                authenticate("vendor", ["session", "bearer"]),
            ],
        },
        {
            matcher: "/vendors/products",
            method: "POST",
            middlewares: [
                authenticate("vendor", ["session", "bearer"]),
                validateAndTransformBody(AdminCreateProduct),
            ],
        },
    ],
})