"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { QuestionView } from "./question-view"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSSE } from "../use-sse"
import { toast } from "@/app/hooks/use-toast"
import { submitFormResponse } from "./actions"

type FormViewerProps = {
  form: any
}

export function FormViewer({ form }: FormViewerProps) {
  const router = useRouter()
  const [answers, setAnswers] = useState<Record<number, any>>({})
  const [files, setFiles] = useState<Record<number, File>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formUpdated, setFormUpdated] = useState(false)

  // Only listen for form deletion events
  useSSE(`form-${form.id}`, {
    onMessage: (data) => {
      if (data.type === "form-deleted") {
        toast({
          title: "Form has been deleted",
          description: "This form is no longer available.",
        })
        router.push("/")
      }
    },
  })

  const handleAnswerChange = (questionId: number, value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }))
  }

  const handleFileChange = (questionId: number, file: File | null) => {
    if (file) {
      setFiles((prev) => ({
        ...prev,
        [questionId]: file,
      }))
    } else {
      const newFiles = { ...files }
      delete newFiles[questionId]
      setFiles(newFiles)
    }
  }

  const handleSubmit = async () => {
    // Validate required questions
    const requiredQuestions = form.questions.filter((q: any) => q.required)
    const unansweredQuestions = requiredQuestions.filter((q: any) => {
      if (q.type === "FILE") {
        return !files[q.id]
      }

      const answer = answers[q.id]
      if (!answer) return true

      if (q.type === "TEXT" || q.type === "TEXTAREA") {
        return !answer.trim()
      }

      if (q.type === "RADIO" || q.type === "DROPDOWN") {
        return answer === undefined
      }

      if (q.type === "CHECKBOX") {
        return !answer.length
      }

      return true
    })

    if (unansweredQuestions.length > 0) {
      toast({
        title: "Please answer all required questions",
      })
      return
    }

    try {
      setIsSubmitting(true)

      // Create FormData for file uploads
      const formData = new FormData()
      formData.append("formId", form.id.toString())

      // Add answers data
      formData.append(
        "answers",
        JSON.stringify(
          Object.entries(answers).map(([questionId, value]) => ({
            questionId: Number.parseInt(questionId),
            value,
          })),
        ),
      )

      // Add files
      Object.entries(files).forEach(([questionId, file]) => {
        formData.append(`file-${questionId}`, file)
      })

      await submitFormResponse(formData)

      toast({
        title: "Form submitted successfully",
      })

      // Redirect to a thank you page or back to the forms list
      router.push("/")
    } catch (error) {
      console.error("Error submitting form:", error)
      toast({
        title: "Error submitting form",
        description: "Please try again later",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Submit Your Response</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {form.questions.map((question: any) => (
          <QuestionView
            key={question.id}
            question={question}
            value={answers[question.id]}
            file={files[question.id]}
            onChange={(value) => handleAnswerChange(question.id, value)}
            onFileChange={(file) => handleFileChange(question.id, file)}
          />
        ))}
      </CardContent>
      <CardFooter>
        <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Submitting..." : "Submit"}
        </Button>
      </CardFooter>
    </Card>
  )
}
