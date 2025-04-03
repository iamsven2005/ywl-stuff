import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "../login/actions";
import ProjectTypesPage from "./client";
import { checkUserPermission } from "../actions/permission-actions";

export default async function Page(){
        const currentUser = await getCurrentUser()
        if (!currentUser) {
          redirect("/login")
        }
        const perm = await checkUserPermission(currentUser.id, "/project-types")
        if (perm.hasPermission === false) {
          return notFound()
        }
    return(
        <ProjectTypesPage/>
    )
}