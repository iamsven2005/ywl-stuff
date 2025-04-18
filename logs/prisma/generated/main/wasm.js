
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
  fileType: 'fileType'
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
  TeamLocation: 'TeamLocation'
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
