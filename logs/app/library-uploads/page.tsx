import { notFound, redirect } from "next/navigation";
import { checkUserPermission } from "../actions/permission-actions";
import { getCurrentUser } from "../login/actions";
import UploadForm from "./upload-form";
// This page is for upload of books from html file
export default async function UploadsPage() {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        redirect("/login")
      }
      const perm = await checkUserPermission(currentUser.id, "/library-uploads")
      if (perm.hasPermission === false) {
        return notFound()
      }
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">HTML Book Catalog Parser</h1>
      <p className="mb-6 text-gray-600">
        Upload an HTML file from the YWL Engineering Portal to extract book information.
      </p>
      <UploadForm />
    </div>
  )
}