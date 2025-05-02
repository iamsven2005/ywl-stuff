
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 6.4.1
 * Query Engine version: a9055b89e58b4b5bfb59600785423b1db3d0e75d
 */
Prisma.prismaVersion = {
  client: "6.4.1",
  engine: "a9055b89e58b4b5bfb59600785423b1db3d0e75d"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.LogsScalarFieldEnum = {
  id: 'id',
  name: 'name',
  host: 'host',
  timestamp: 'timestamp',
  piuser: 'piuser',
  pid: 'pid',
  action: 'action',
  cpu: 'cpu',
  mem: 'mem',
  command: 'command',
  port: 'port',
  ipAddress: 'ipAddress'
};

exports.Prisma.AuthScalarFieldEnum = {
  id: 'id',
  timestamp: 'timestamp',
  username: 'username',
  log_entry: 'log_entry'
};

exports.Prisma.Memory_usageScalarFieldEnum = {
  id: 'id',
  total_memory: 'total_memory',
  used_memory: 'used_memory',
  free_memory: 'free_memory',
  available_memory: 'available_memory',
  percent_usage: 'percent_usage',
  host: 'host',
  time: 'time'
};

exports.Prisma.System_metricsScalarFieldEnum = {
  id: 'id',
  timestamp: 'timestamp',
  sensor_name: 'sensor_name',
  value_type: 'value_type',
  value: 'value',
  host: 'host',
  min: 'min',
  max: 'max'
};

exports.Prisma.DiskmetricScalarFieldEnum = {
  id: 'id',
  host: 'host',
  name: 'name',
  label: 'label',
  totalgb: 'totalgb',
  usedgb: 'usedgb',
  freegb: 'freegb',
  timestamp: 'timestamp'
};

exports.Prisma.NotesScalarFieldEnum = {
  id: 'id',
  title: 'title',
  time: 'time',
  description: 'description'
};

exports.Prisma.DevicesScalarFieldEnum = {
  id: 'id',
  name: 'name',
  ip_address: 'ip_address',
  mac_address: 'mac_address',
  password: 'password',
  time: 'time',
  notes: 'notes',
  status: 'status'
};

exports.Prisma.DeviceUserScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  deviceId: 'deviceId',
  role: 'role'
};

exports.Prisma.CommandScalarFieldEnum = {
  id: 'id',
  ruleId: 'ruleId',
  command: 'command',
  emailTemplateId: 'emailTemplateId'
};

exports.Prisma.RuleScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  groupId: 'groupId',
  emailTemplateId: 'emailTemplateId'
};

exports.Prisma.RuleGroupScalarFieldEnum = {
  id: 'id',
  name: 'name',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  emailTemplateId: 'emailTemplateId'
};

exports.Prisma.CommandMatchScalarFieldEnum = {
  id: 'id',
  logId: 'logId',
  logType: 'logType',
  commandId: 'commandId',
  ruleId: 'ruleId',
  commandText: 'commandText',
  logEntry: 'logEntry',
  timestamp: 'timestamp',
  addressed: 'addressed',
  addressedBy: 'addressedBy',
  addressedAt: 'addressedAt',
  notes: 'notes',
  emailSent: 'emailSent'
};

exports.Prisma.ActivityLogScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  actionType: 'actionType',
  targetType: 'targetType',
  targetId: 'targetId',
  details: 'details',
  timestamp: 'timestamp'
};

exports.Prisma.EmailTemplateScalarFieldEnum = {
  id: 'id',
  name: 'name',
  subject: 'subject',
  body: 'body',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  username: 'username',
  password: 'password',
  email: 'email',
  role: 'role',
  Mobile: 'Mobile',
  Pay: 'Pay',
  PrimaryContact: 'PrimaryContact',
  MobileContact: 'MobileContact',
  Relationship: 'Relationship',
  SecondContact: 'SecondContact',
  SecondMobile: 'SecondMobile',
  SecondRelationship: 'SecondRelationship',
  Remarks: 'Remarks',
  ndafile: 'ndafile',
  ndasubmissiondate: 'ndasubmissiondate',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  location: 'location'
};

exports.Prisma.GroupScalarFieldEnum = {
  id: 'id',
  name: 'name',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.GroupMemberScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  groupId: 'groupId',
  joinedAt: 'joinedAt'
};

exports.Prisma.MessageScalarFieldEnum = {
  id: 'id',
  content: 'content',
  senderId: 'senderId',
  groupId: 'groupId',
  edited: 'edited',
  createdAt: 'createdAt',
  fileAttachment: 'fileAttachment',
  fileOriginalName: 'fileOriginalName',
  fileType: 'fileType',
  isPoll: 'isPoll'
};

exports.Prisma.UserEmailTemplateScalarFieldEnum = {
  userId: 'userId',
  emailTemplateId: 'emailTemplateId',
  assignedAt: 'assignedAt'
};

exports.Prisma.RolesScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description'
};

exports.Prisma.NotificationScalarFieldEnum = {
  id: 'id',
  title: 'title',
  content: 'content',
  postDate: 'postDate',
  expiryDate: 'expiryDate',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  important: 'important'
};

exports.Prisma.NotificationReadScalarFieldEnum = {
  id: 'id',
  notificationId: 'notificationId',
  userId: 'userId',
  readAt: 'readAt'
};

exports.Prisma.SavedQueryScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  tableName: 'tableName',
  columns: 'columns',
  conditions: 'conditions',
  emailTemplateId: 'emailTemplateId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TicketCommentScalarFieldEnum = {
  id: 'id',
  ticketId: 'ticketId',
  userId: 'userId',
  content: 'content',
  createdAt: 'createdAt'
};

exports.Prisma.SupportTicketScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  status: 'status',
  priority: 'priority',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  assignedToId: 'assignedToId',
  createdById: 'createdById',
  relatedDeviceId: 'relatedDeviceId'
};

exports.Prisma.TicketAttachmentScalarFieldEnum = {
  id: 'id',
  filename: 'filename',
  originalFilename: 'originalFilename',
  fileSize: 'fileSize',
  mimeType: 'mimeType',
  createdAt: 'createdAt',
  ticketId: 'ticketId',
  commentId: 'commentId',
  uploaderId: 'uploaderId'
};

exports.Prisma.AlertConditionScalarFieldEnum = {
  id: 'id',
  name: 'name',
  sourceTable: 'sourceTable',
  fieldName: 'fieldName',
  comparator: 'comparator',
  thresholdValue: 'thresholdValue',
  timeWindowMin: 'timeWindowMin',
  repeatIntervalMin: 'repeatIntervalMin',
  countThreshold: 'countThreshold',
  lastTriggeredAt: 'lastTriggeredAt',
  active: 'active',
  emailTemplateId: 'emailTemplateId'
};

exports.Prisma.AlertEventScalarFieldEnum = {
  id: 'id',
  conditionId: 'conditionId',
  triggeredAt: 'triggeredAt',
  resolved: 'resolved',
  resolvedAt: 'resolvedAt',
  notes: 'notes'
};

exports.Prisma.LibraryEntryScalarFieldEnum = {
  id: 'id',
  refNo: 'refNo',
  category: 'category',
  title: 'title',
  author: 'author',
  pubYear: 'pubYear',
  creationDate: 'creationDate',
  borrower: 'borrower',
  loanDate: 'loanDate',
  remarks: 'remarks',
  attachmentUrl: 'attachmentUrl',
  attachmentFilename: 'attachmentFilename',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.FeedbackScalarFieldEnum = {
  id: 'id',
  subject: 'subject',
  message: 'message',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  isRead: 'isRead',
  senderId: 'senderId'
};

exports.Prisma.FeedbackRecipientScalarFieldEnum = {
  id: 'id',
  feedbackId: 'feedbackId',
  userId: 'userId'
};

exports.Prisma.PagePermissionScalarFieldEnum = {
  id: 'id',
  route: 'route',
  description: 'description',
  createdAt: 'createdAt'
};

exports.Prisma.RolePermissionScalarFieldEnum = {
  id: 'id',
  roleName: 'roleName',
  pagePermissionId: 'pagePermissionId'
};

exports.Prisma.UserPermissionScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  pagePermissionId: 'pagePermissionId'
};

exports.Prisma.PagesScalarFieldEnum = {
  id: 'id',
  notes: 'notes'
};

exports.Prisma.ProjectTypeScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description'
};

exports.Prisma.ProjectScalarFieldEnum = {
  id: 'id',
  businessCode: 'businessCode',
  projectCode: 'projectCode',
  name: 'name',
  description: 'description',
  location: 'location',
  startDate: 'startDate',
  estimatedEndDate: 'estimatedEndDate',
  actualEndDate: 'actualEndDate',
  budget: 'budget',
  status: 'status',
  createDate: 'createDate',
  projectTypeId: 'projectTypeId'
};

exports.Prisma.ModelEntryScalarFieldEnum = {
  id: 'id',
  code: 'code',
  description: 'description',
  createDate: 'createDate',
  createBy: 'createBy',
  modifyDate: 'modifyDate',
  modifyBy: 'modifyBy',
  projectId: 'projectId'
};

exports.Prisma.ProjectAssignmentScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  projectId: 'projectId',
  role: 'role'
};

exports.Prisma.SambaLogScalarFieldEnum = {
  id: 'id',
  timestamp: 'timestamp',
  component: 'component',
  level: 'level',
  message: 'message',
  zone: 'zone',
  name: 'name',
  errorCode: 'errorCode',
  errorName: 'errorName',
  hostname: 'hostname',
  createdAt: 'createdAt'
};

exports.Prisma.LocationScalarFieldEnum = {
  id: 'id',
  code: 'code',
  name: 'name',
  modifyBy: 'modifyBy',
  createBy: 'createBy',
  modifyDate: 'modifyDate',
  CCY: 'CCY',
  Region: 'Region',
  Remarks: 'Remarks',
  WCI_URL: 'WCI_URL',
  createDate: 'createDate',
  fullname: 'fullname'
};

exports.Prisma.LdapuserScalarFieldEnum = {
  dn: 'dn',
  objectClass: 'objectClass',
  cn: 'cn',
  sn: 'sn',
  givenName: 'givenName',
  instanceType: 'instanceType',
  whenCreated: 'whenCreated',
  displayName: 'displayName',
  uSNCreated: 'uSNCreated',
  name: 'name',
  objectGUID: 'objectGUID',
  badPwdCount: 'badPwdCount',
  codePage: 'codePage',
  countryCode: 'countryCode',
  badPasswordTime: 'badPasswordTime',
  lastLogoff: 'lastLogoff',
  lastLogon: 'lastLogon',
  primaryGroupID: 'primaryGroupID',
  objectSid: 'objectSid',
  accountExpires: 'accountExpires',
  logonCount: 'logonCount',
  sAMAccountName: 'sAMAccountName',
  sAMAccountType: 'sAMAccountType',
  userPrincipalName: 'userPrincipalName',
  objectCategory: 'objectCategory',
  pwdLastSet: 'pwdLastSet',
  userAccountControl: 'userAccountControl',
  whenChanged: 'whenChanged',
  uSNChanged: 'uSNChanged',
  distinguishedName: 'distinguishedName',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  adminCount: 'adminCount',
  description: 'description',
  isCriticalSystemObject: 'isCriticalSystemObject',
  memberOf: 'memberOf',
  servicePrincipalName: 'servicePrincipalName',
  showInAdvancedViewOnly: 'showInAdvancedViewOnly',
  id: 'id'
};

exports.Prisma.DriveFolderScalarFieldEnum = {
  id: 'id',
  name: 'name',
  parentId: 'parentId',
  ownerId: 'ownerId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.DriveFileScalarFieldEnum = {
  id: 'id',
  name: 'name',
  type: 'type',
  size: 'size',
  order: 'order',
  folderId: 'folderId',
  ownerId: 'ownerId',
  url: 'url',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.DriveFilePermissionScalarFieldEnum = {
  id: 'id',
  fileId: 'fileId',
  userId: 'userId',
  access: 'access',
  grantedBy: 'grantedBy',
  grantedAt: 'grantedAt'
};

exports.Prisma.JobTitleScalarFieldEnum = {
  id: 'id',
  sn: 'sn',
  jobTitle: 'jobTitle',
  abbreviation: 'abbreviation',
  grade: 'grade',
  seniorityLevel: 'seniorityLevel',
  selectableInStaffCV: 'selectableInStaffCV',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.UserActivityScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  username: 'username',
  page: 'page',
  loginTime: 'loginTime'
};

exports.Prisma.TeamScalarFieldEnum = {
  id: 'id',
  sequence: 'sequence',
  remarks: 'remarks',
  name: 'name',
  description: 'description',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TeamLeaderScalarFieldEnum = {
  id: 'id',
  teamId: 'teamId',
  userId: 'userId'
};

exports.Prisma.TeamMemberScalarFieldEnum = {
  id: 'id',
  teamId: 'teamId',
  userId: 'userId'
};

exports.Prisma.TeamLocationScalarFieldEnum = {
  id: 'id',
  teamId: 'teamId',
  locationId: 'locationId'
};

exports.Prisma.AuditWorkflowScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AuditStepScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  position: 'position',
  status: 'status',
  assignedToId: 'assignedToId',
  dueDate: 'dueDate',
  workflowId: 'workflowId'
};

exports.Prisma.StepLogScalarFieldEnum = {
  id: 'id',
  stepId: 'stepId',
  message: 'message',
  createdBy: 'createdBy',
  createdAt: 'createdAt'
};

exports.Prisma.CompanyScalarFieldEnum = {
  id: 'id',
  name: 'name',
  type: 'type',
  industry: 'industry',
  address: 'address',
  phone: 'phone',
  email: 'email',
  website: 'website',
  remarks: 'remarks',
  specialties: 'specialties',
  certifications: 'certifications',
  rating: 'rating',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ContactPersonScalarFieldEnum = {
  id: 'id',
  name: 'name',
  title: 'title',
  email: 'email',
  phone: 'phone',
  remarks: 'remarks',
  expertise: 'expertise',
  companyId: 'companyId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CRMInteractionScalarFieldEnum = {
  id: 'id',
  title: 'title',
  notes: 'notes',
  interactionType: 'interactionType',
  interactionDate: 'interactionDate',
  outcome: 'outcome',
  followUpRequired: 'followUpRequired',
  followUpDate: 'followUpDate',
  contactId: 'contactId',
  companyId: 'companyId',
  projectId: 'projectId',
  createdAt: 'createdAt'
};

exports.Prisma.ProjectCompanyLinkScalarFieldEnum = {
  id: 'id',
  projectId: 'projectId',
  companyId: 'companyId',
  role: 'role',
  notes: 'notes',
  startDate: 'startDate',
  endDate: 'endDate',
  contractValue: 'contractValue',
  contractStatus: 'contractStatus',
  createdAt: 'createdAt'
};

exports.Prisma.BridgeProjectScalarFieldEnum = {
  id: 'id',
  projectId: 'projectId',
  bridgeType: 'bridgeType',
  spanLength: 'spanLength',
  width: 'width',
  height: 'height',
  loadCapacity: 'loadCapacity',
  waterway: 'waterway',
  environmentalConsiderations: 'environmentalConsiderations',
  trafficImpact: 'trafficImpact',
  permitNumbers: 'permitNumbers',
  designDocuments: 'designDocuments',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.BridgePhaseScalarFieldEnum = {
  id: 'id',
  bridgeProjectId: 'bridgeProjectId',
  name: 'name',
  description: 'description',
  startDate: 'startDate',
  endDate: 'endDate',
  status: 'status',
  completionPercentage: 'completionPercentage',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PhaseInspectionScalarFieldEnum = {
  id: 'id',
  bridgePhaseId: 'bridgePhaseId',
  inspectionDate: 'inspectionDate',
  inspector: 'inspector',
  result: 'result',
  notes: 'notes',
  attachments: 'attachments',
  createdAt: 'createdAt'
};

exports.Prisma.BridgeMaterialScalarFieldEnum = {
  id: 'id',
  bridgeProjectId: 'bridgeProjectId',
  name: 'name',
  specification: 'specification',
  quantity: 'quantity',
  unit: 'unit',
  estimatedCost: 'estimatedCost',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.MaterialOrderScalarFieldEnum = {
  id: 'id',
  bridgeMaterialId: 'bridgeMaterialId',
  vendorId: 'vendorId',
  orderDate: 'orderDate',
  deliveryDate: 'deliveryDate',
  status: 'status',
  quantity: 'quantity',
  unitPrice: 'unitPrice',
  totalPrice: 'totalPrice',
  invoiceNumber: 'invoiceNumber',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.BidSubmissionScalarFieldEnum = {
  id: 'id',
  bridgeProjectId: 'bridgeProjectId',
  companyId: 'companyId',
  submissionDate: 'submissionDate',
  bidAmount: 'bidAmount',
  proposedSchedule: 'proposedSchedule',
  technicalDetails: 'technicalDetails',
  status: 'status',
  evaluationScore: 'evaluationScore',
  evaluationNotes: 'evaluationNotes',
  attachments: 'attachments',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PollScalarFieldEnum = {
  id: 'id',
  question: 'question',
  multiSelect: 'multiSelect',
  messageId: 'messageId',
  createdAt: 'createdAt'
};

exports.Prisma.PollOptionScalarFieldEnum = {
  id: 'id',
  text: 'text',
  pollId: 'pollId'
};

exports.Prisma.PollVoteScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  optionId: 'optionId',
  pollId: 'pollId',
  createdAt: 'createdAt'
};

exports.Prisma.LeaveScalarFieldEnum = {
  id: 'id',
  startDate: 'startDate',
  endDate: 'endDate',
  leaveType: 'leaveType',
  reason: 'reason',
  status: 'status',
  approverComment: 'approverComment',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  approvedAt: 'approvedAt',
  rejectedAt: 'rejectedAt',
  userId: 'userId',
  approverId: 'approverId'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};
exports.ProjectStatus = exports.$Enums.ProjectStatus = {
  PLANNING: 'PLANNING',
  BIDDING: 'BIDDING',
  DESIGN: 'DESIGN',
  PERMITTING: 'PERMITTING',
  CONSTRUCTION: 'CONSTRUCTION',
  INSPECTION: 'INSPECTION',
  COMPLETED: 'COMPLETED',
  ON_HOLD: 'ON_HOLD',
  CANCELLED: 'CANCELLED'
};

exports.StepStatus = exports.$Enums.StepStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  REVIEW: 'REVIEW',
  COMPLETED: 'COMPLETED',
  REJECTED: 'REJECTED'
};

exports.CompanyType = exports.$Enums.CompanyType = {
  CONTRACTOR: 'CONTRACTOR',
  VENDOR: 'VENDOR',
  PARTNER: 'PARTNER',
  CONSULTANT: 'CONSULTANT',
  REGULATORY: 'REGULATORY',
  SUBCONTRACTOR: 'SUBCONTRACTOR'
};

exports.BridgeType = exports.$Enums.BridgeType = {
  ARCH: 'ARCH',
  BEAM: 'BEAM',
  TRUSS: 'TRUSS',
  SUSPENSION: 'SUSPENSION',
  CABLE_STAYED: 'CABLE_STAYED',
  CANTILEVER: 'CANTILEVER',
  MOVABLE: 'MOVABLE',
  CULVERT: 'CULVERT',
  OTHER: 'OTHER'
};

exports.PhaseStatus = exports.$Enums.PhaseStatus = {
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  DELAYED: 'DELAYED',
  ON_HOLD: 'ON_HOLD'
};

exports.OrderStatus = exports.$Enums.OrderStatus = {
  PLANNED: 'PLANNED',
  ORDERED: 'ORDERED',
  PARTIALLY_DELIVERED: 'PARTIALLY_DELIVERED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED'
};

exports.BidStatus = exports.$Enums.BidStatus = {
  SUBMITTED: 'SUBMITTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  SHORTLISTED: 'SHORTLISTED',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  WITHDRAWN: 'WITHDRAWN'
};

exports.Prisma.ModelName = {
  logs: 'logs',
  auth: 'auth',
  memory_usage: 'memory_usage',
  system_metrics: 'system_metrics',
  diskmetric: 'diskmetric',
  notes: 'notes',
  devices: 'devices',
  DeviceUser: 'DeviceUser',
  Command: 'Command',
  Rule: 'Rule',
  RuleGroup: 'RuleGroup',
  CommandMatch: 'CommandMatch',
  ActivityLog: 'ActivityLog',
  EmailTemplate: 'EmailTemplate',
  User: 'User',
  Group: 'Group',
  GroupMember: 'GroupMember',
  Message: 'Message',
  UserEmailTemplate: 'UserEmailTemplate',
  Roles: 'Roles',
  Notification: 'Notification',
  NotificationRead: 'NotificationRead',
  SavedQuery: 'SavedQuery',
  TicketComment: 'TicketComment',
  SupportTicket: 'SupportTicket',
  TicketAttachment: 'TicketAttachment',
  AlertCondition: 'AlertCondition',
  AlertEvent: 'AlertEvent',
  LibraryEntry: 'LibraryEntry',
  Feedback: 'Feedback',
  FeedbackRecipient: 'FeedbackRecipient',
  PagePermission: 'PagePermission',
  RolePermission: 'RolePermission',
  UserPermission: 'UserPermission',
  pages: 'pages',
  ProjectType: 'ProjectType',
  Project: 'Project',
  ModelEntry: 'ModelEntry',
  ProjectAssignment: 'ProjectAssignment',
  SambaLog: 'SambaLog',
  location: 'location',
  ldapuser: 'ldapuser',
  DriveFolder: 'DriveFolder',
  DriveFile: 'DriveFile',
  DriveFilePermission: 'DriveFilePermission',
  JobTitle: 'JobTitle',
  UserActivity: 'UserActivity',
  Team: 'Team',
  TeamLeader: 'TeamLeader',
  TeamMember: 'TeamMember',
  TeamLocation: 'TeamLocation',
  AuditWorkflow: 'AuditWorkflow',
  AuditStep: 'AuditStep',
  StepLog: 'StepLog',
  Company: 'Company',
  ContactPerson: 'ContactPerson',
  CRMInteraction: 'CRMInteraction',
  ProjectCompanyLink: 'ProjectCompanyLink',
  BridgeProject: 'BridgeProject',
  BridgePhase: 'BridgePhase',
  PhaseInspection: 'PhaseInspection',
  BridgeMaterial: 'BridgeMaterial',
  MaterialOrder: 'MaterialOrder',
  BidSubmission: 'BidSubmission',
  Poll: 'Poll',
  PollOption: 'PollOption',
  PollVote: 'PollVote',
  Leave: 'Leave'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
