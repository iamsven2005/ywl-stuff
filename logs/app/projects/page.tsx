import ProjectTypesPage from "../project-types/page";
import { notFound, redirect } from "next/navigation"
import { getCurrentUser } from "../login/actions"
import { checkUserPermission } from "../actions/permission-actions"
import ProjectsPage from "./client";

export default async function Page(){
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      redirect("/login")
    }
    const perm = await checkUserPermission(currentUser.id, "/projects")
    if (perm.hasPermission === false) {
      return notFound()
    }
    return(
        <ProjectsPage/>
    )
}