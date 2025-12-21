import { ITaxProvider } from "@medusajs/framework/types"
import Avatax from "avatax"
import { MedusaError } from "@medusajs/framework/utils"
import { ModuleOptions } from "./types"
import { CreateTransactionModel } from "avatax/lib/models/CreateTransactionModel"
import { 
  ItemTaxCalculationLine, 
  ItemTaxLineDTO, 
  ShippingTaxCalculationLine, 
  ShippingTaxLineDTO, 
  TaxCalculationContext,
} from "@medusajs/framework/types"
type InjectedDependencies = {
  // Add any dependencies you want to inject via the module container
}

class AvalaraTaxModuleProvider implements ITaxProvider {
  static identifier = "avalara"
  private readonly avatax: Avatax
  private readonly options: ModuleOptions



  constructor({}: InjectedDependencies, options: ModuleOptions) {
    this.options = options
    if (!options?.username || !options?.password || !options?.companyId) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Avalara module options are required: username, password and companyId"
      )
    }
    this.avatax = new Avatax({
      appName: options.appName || "medusa",
      appVersion: options.appVersion || "1.0.0",
      machineName: options.machineName || "medusa",
      environment: options.appEnvironment === "production" ? "production" : "sandbox",
      timeout: options.timeout || 3000,
    }).withSecurity({
      username: options.username,
      password: options.password,
    })
  }
 getIdentifier(): string {

    return AvalaraTaxModuleProvider.identifier

  }


  async createTransaction(model: CreateTransactionModel) {

    try {
   const response = await this.avatax.createTransaction({
  model,
 include: "Details",

      })
 return response

    } catch (error) {

      throw new MedusaError(

        MedusaError.Types.UNEXPECTED_STATE,

        `An error occurred while creating transaction for Avalara: ${error}`
  )} }

async getTaxLines(
    itemLines: ItemTaxCalculationLine[], 
    shippingLines: ShippingTaxCalculationLine[],
    context: TaxCalculationContext
  ): Promise<(ItemTaxLineDTO | ShippingTaxLineDTO)[]> {
    try {
      const currencyCode = (
        itemLines[0]?.line_item.currency_code || shippingLines[0]?.shipping_line.currency_code
      )?.toUpperCase()
      const response = await this.createTransaction({
        lines: [
          ...(itemLines.length ? itemLines.map((line) => {
            const quantity = Number(line.line_item.quantity) ?? 0
            return {
              number: line.line_item.id,
              quantity,
              amount: quantity * (Number(line.line_item.unit_price) ?? 0),
              taxCode: line.rates.find((rate) => rate.is_default)?.code ?? "",
              itemCode: line.line_item.product_id,
            }
          }) : []),
          ...(shippingLines.length ? shippingLines.map((line) => {
            return {
              number: line.shipping_line.id,
              quantity: 1,
              amount: Number(line.shipping_line.unit_price) ?? 0,
              taxCode: line.rates.find((rate) => rate.is_default)?.code ?? "",
            }
          }) : []),
        ],
        date: new Date(),
        customerCode: context.customer?.id ?? "",
        addresses: {
          "singleLocation": {
            line1: context.address.address_1 ?? "",
            line2: context.address.address_2 ?? "",
            city: context.address.city ?? "",
            region: context.address.province_code ?? "",
            postalCode: context.address.postal_code ?? "",
            country: context.address.country_code.toUpperCase() ?? "",
          },
        },
        currencyCode,
      //  type: "SalesOrder" as DocumentType,

      })




const taxLines: (ItemTaxLineDTO | ShippingTaxLineDTO)[] = []
response?.lines?.forEach((line) => {
  line.details?.forEach((detail) => {
    const isShippingLine = shippingLines.find(
      (sLine) => sLine.shipping_line.id === line.lineNumber
    ) !== undefined
    const commonData = {
      rate: (detail.rate ?? 0) * 100,
      name: detail.taxName ?? "",
      code: line.taxCode || detail.rateTypeCode || detail.signatureCode || "",
      provider_id: this.getIdentifier(),
    }
    if (!isShippingLine) {
      taxLines.push({
        ...commonData,
        line_item_id: line.lineNumber ?? "",
      })
    } else {
      taxLines.push({
        ...commonData,
        shipping_line_id: line.lineNumber ?? "",
      })
    }
  })
})

return taxLines



























      // TODO return tax lines
    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `An error occurred while getting tax lines from Avalara: ${error}`
      )
    }
  }


}

export default AvalaraTaxModuleProvider