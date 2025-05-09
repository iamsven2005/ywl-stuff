import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function parseBool(val: any): boolean | null {
  if (typeof val === 'string') {
    return val.toLowerCase() === 'true';
  }
  return null;
}
function safeBigInt(value: any): bigint | null {
    if (value === undefined || value === null || value === '') return null;
    return BigInt(value.replace?.('.0Z', '') ?? value);
  }
  
export async function POST(req: NextRequest) {
  try {
    const { users } = await req.json();

    if (!Array.isArray(users)) {
      return NextResponse.json({ error: 'Expected an array of user objects in `users` key' }, { status: 400 });
    }

    const formattedUsers = users.map((entry: any) => ({
        dn: entry.dn,
        objectClass: Array.isArray(entry.objectClass) ? entry.objectClass : [entry.objectClass],
        cn: entry.cn,
        sn: entry.sn ?? null,
        givenName: entry.givenName ?? null,
        description: entry.description ?? null,
        instanceType: Number(entry.instanceType),
        whenCreated: safeBigInt(entry.whenCreated),
        whenChanged: safeBigInt(entry.whenChanged),
        uSNCreated: Number(entry.uSNCreated),
        uSNChanged: Number(entry.uSNChanged),
        showInAdvancedViewOnly: parseBool(entry.showInAdvancedViewOnly),
        name: entry.name,
        objectGUID: entry.objectGUID,
        userAccountControl: Number(entry.userAccountControl),
        badPwdCount: Number(entry.badPwdCount),
        codePage: Number(entry.codePage),
        countryCode: Number(entry.countryCode),
        badPasswordTime: safeBigInt(entry.badPasswordTime),
        lastLogoff: safeBigInt(entry.lastLogoff),
        lastLogon: safeBigInt(entry.lastLogon),
        pwdLastSet: safeBigInt(entry.pwdLastSet),
        primaryGroupID: Number(entry.primaryGroupID),
        objectSid: entry.objectSid,
        adminCount: entry.adminCount ? Number(entry.adminCount) : null,
        accountExpires: safeBigInt(entry.accountExpires),
        logonCount: Number(entry.logonCount),
        sAMAccountName: entry.sAMAccountName,
        sAMAccountType: Number(entry.sAMAccountType),
        servicePrincipalName: entry.servicePrincipalName ?? null,
        objectCategory: entry.objectCategory,
        isCriticalSystemObject: parseBool(entry.isCriticalSystemObject),
        memberOf: entry.memberOf ?? null,
        userPrincipalName: entry.userPrincipalName ?? null,
        displayName: entry.displayName ?? null,
        distinguishedName: entry.distinguishedName,
      }));
      

    const result = await prisma.ldapuser.createMany({
      data: formattedUsers,
      skipDuplicates: true,
    });

    return NextResponse.json({ success: true, count: result.count });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
