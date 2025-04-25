import {
  type AuditWorkflow as PrismaAuditWorkflow,
  type AuditStep as PrismaAuditStep,
  type StepLog as PrismaStepLog,
  StepStatus,
  type User as PrismaUser,
} from "@/prisma/generated/main"

// Extended types with relations
export type AuditWorkflow = PrismaAuditWorkflow & {
  steps?: AuditStep[]
}

export type AuditStep = PrismaAuditStep & {
  assignedTo?: User | null
  logs?: StepLog[]
}

export type StepLog = PrismaStepLog

export type User = PrismaUser

export { StepStatus }
