import { Module } from "@medusajs/framework/utils"
import QaModuleService from "./service"

export const QA_MODULE = "qa"

export default Module(QA_MODULE, {
  service: QaModuleService,
})
