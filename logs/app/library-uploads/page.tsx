import UploadForm from "./upload-form";
// This page is for upload of books from html file
export default function UploadsPage() {
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