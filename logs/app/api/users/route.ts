// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!Array.isArray(body)) {
      return NextResponse.json({ error: 'Expected an array of user objects' }, { status: 400 });
    }

    const users = body.map((entry: any) => ({
      dn: entry.dn,
      objectClass: Array.isArray(entry.objectClass) ? entry.objectClass : [entry.objectClass],
      cn: entry.cn,
      sn: entry.sn,
      givenName: entry.givenName,
      instanceType: Number(entry.instanceType),
      whenCreated: BigInt(entry.whenCreated),
      displayName: entry.displayName,
      uSNCreated: Number(entry.uSNCreated),
      name: entry.name,
      objectGUID: entry.objectGUID,
      badPwdCount: Number(entry.badPwdCount),
      codePage: Number(entry.codePage),
      countryCode: Number(entry.countryCode),
      badPasswordTime: BigInt(entry.badPasswordTime),
      lastLogoff: BigInt(entry.lastLogoff),
      lastLogon: BigInt(entry.lastLogon),
      primaryGroupID: Number(entry.primaryGroupID),
      objectSid: entry.objectSid,
      accountExpires: BigInt(entry.accountExpires),
      logonCount: Number(entry.logonCount),
      sAMAccountName: entry.sAMAccountName,
      sAMAccountType: Number(entry.sAMAccountType),
      userPrincipalName: entry.userPrincipalName,
      objectCategory: entry.objectCategory,
      pwdLastSet: BigInt(entry.pwdLastSet),
      userAccountControl: Number(entry.userAccountControl),
      whenChanged: BigInt(entry.whenChanged),
      uSNChanged: Number(entry.uSNChanged),
      lastLogonTimestamp: BigInt(entry.lastLogonTimestamp),
      distinguishedName: entry.distinguishedName,
    }));

    const createdUsers = await prisma.ldapuser.createMany({
      data: users,
      skipDuplicates: true,
    });

    return NextResponse.json({ success: true, count: createdUsers.count });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
