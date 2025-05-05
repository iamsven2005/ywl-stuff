"use server"

import fs from "fs"
import path from "path"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { QuestionType } from "@/prisma/generated/main"
import { publish } from "../broadcast"

// Initialize uploads directory
const uploadsDir = path.join(process.cwd(), "uploads")
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Get all forms
export async function getForms() {
  try {
    const forms = await db.form.findMany({
      include: {
        questions: true,
        responses: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })
    return forms
  } catch (error) {
    console.error("Error fetching forms:", error)
    return []
  }
}

// Search forms
export async function searchForms(query: string) {
  if (!query) return getForms()

  try {
    const forms = await db.form.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      },
      include: {
        questions: true,
        responses: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })
    return forms
  } catch (error) {
    console.error("Error searching forms:", error)
    return []
  }
}

// Get a form by ID
export async function getFormById(id: number) {
  try {
    const form = await db.form.findUnique({
      where: { id },
      include: {
        questions: {
          include: {
            options: true,
          },
          orderBy: {
            order: "asc",
          },
        },
      },
    })
    return form
  } catch (error) {
    console.error(`Error fetching form ${id}:`, error)
    return null
  }
}

// Get a form with all responses
export async function getFormWithResponses(id: number) {
  try {
    const form = await db.form.findUnique({
      where: { id },
      include: {
        questions: {
          include: {
            options: true,
          },
          orderBy: {
            order: "asc",
          },
        },
        responses: {
          include: {
            answers: true,
          },
          orderBy: {
            submittedAt: "desc",
          },
        },
      },
    })
    return form
  } catch (error) {
    console.error(`Error fetching form with responses ${id}:`, error)
    return null
  }
}

// Create a new form
export async function createForm(formData: any) {
  try {
    // Create the form with nested questions and options
    const form = await db.form.create({
      data: {
        title: formData.title,
        description: formData.description,
        creatorId: 1, // Default user ID, should be replaced with actual user ID
        questions: {
          create: formData.questions.map((q: any, index: number) => ({
            text: q.text,
            type: q.type as QuestionType,
            required: q.required,
            order: index,
            options:
              q.type === "RADIO" || q.type === "CHECKBOX" || q.type === "DROPDOWN"
                ? {
                    create: q.options.map((o: any) => ({
                      text: o.text,
                      value: o.value,
                    })),
                  }
                : undefined,
          })),
        },
      },
    })

    revalidatePath("/")
    return form.id
  } catch (error) {
    console.error("Error creating form:", error)
    throw new Error("Failed to create form")
  }
}

// Update an existing form
export async function updateForm(formData: any, userId = "anonymous", userName = "Anonymous User") {
  try {
    const formId = formData.id

    // First, update the form itself
    await db.form.update({
      where: { id: formId },
      data: {
        title: formData.title,
        description: formData.description,
        updatedAt: new Date(),
      },
    })

    // Get existing questions for this form
    const existingQuestions = await db.question.findMany({
      where: { formId },
      include: { options: true },
    })

    // Process each question in the form data
    for (const q of formData.questions) {
      if (q.id && !q.id.toString().startsWith("temp-")) {
        // Update existing question
        const existingQuestion = existingQuestions.find((eq) => eq.id === q.id)

        if (existingQuestion) {
          // Update the question
          await db.question.update({
            where: { id: q.id },
            data: {
              text: q.text,
              type: q.type as QuestionType,
              required: q.required,
              order: q.order,
            },
          })

          // Handle options for this question
          if (q.type === "RADIO" || q.type === "CHECKBOX" || q.type === "DROPDOWN") {
            // Get existing option IDs
            const existingOptionIds = existingQuestion.options.map((o) => o.id)

            // Find options to delete (options in DB but not in the update)
            const optionsToDeleteIds = existingOptionIds.filter((id) => !q.options.some((o: any) => o.id === id))

            // Delete options that are no longer needed
            if (optionsToDeleteIds.length > 0) {
              await db.questionOption.deleteMany({
                where: {
                  id: { in: optionsToDeleteIds },
                },
              })
            }

            // Update or create options
            for (const o of q.options) {
              if (o.id && !o.id.toString().startsWith("temp-")) {
                // Update existing option
                await db.questionOption.update({
                  where: { id: o.id },
                  data: {
                    text: o.text,
                    value: o.value,
                  },
                })
              } else {
                // Create new option
                await db.questionOption.create({
                  data: {
                    questionId: q.id,
                    text: o.text,
                    value: o.value,
                  },
                })
              }
            }
          } else {
            // If question type changed and no longer needs options, delete all options
            if (existingQuestion.options.length > 0) {
              await db.questionOption.deleteMany({
                where: {
                  questionId: q.id,
                },
              })
            }
          }
        }
      } else {
        // Create new question
        const newQuestion = await db.question.create({
          data: {
            formId,
            text: q.text,
            type: q.type as QuestionType,
            required: q.required,
            order: q.order,
          },
        })

        // Create options for this new question if needed
        if ((q.type === "RADIO" || q.type === "CHECKBOX" || q.type === "DROPDOWN") && q.options.length > 0) {
          await db.questionOption.createMany({
            data: q.options.map((o: any) => ({
              questionId: newQuestion.id,
              text: o.text,
              value: o.value,
            })),
          })
        }
      }
    }

    // Delete questions that are no longer in the form
    const updatedQuestionIds = formData.questions
      .filter((q: any) => q.id && !q.id.toString().startsWith("temp-"))
      .map((q: any) => q.id)

    const questionsToDelete = existingQuestions.filter((q) => !updatedQuestionIds.includes(q.id))

    for (const q of questionsToDelete) {
      // Delete options for this question
      await db.questionOption.deleteMany({
        where: { questionId: q.id },
      })

      // Delete answers for this question
      await db.answer.deleteMany({
        where: { questionId: q.id },
      })

      // Delete the question itself
      await db.question.delete({
        where: { id: q.id },
      })
    }

    // Get the updated form
    const updatedForm = await getFormById(formId)

    // Only broadcast response notifications, not form updates
    // We're simplifying to avoid the infinite update loops

    revalidatePath(`/forms/${formId}`)
    revalidatePath(`/forms/${formId}/edit`)
    revalidatePath("/")

    return updatedForm
  } catch (error) {
    console.error("Error updating form:", error)
    throw new Error("Failed to update form")
  }
}

// Submit a form response
export async function submitFormResponse(formData: FormData) {
  try {
    const formId = Number.parseInt(formData.get("formId") as string)
    const answersData = JSON.parse(formData.get("answers") as string)

    // Create response
    const response = await db.formResponse.create({
      data: {
        formId,
        responderId: null, // Anonymous response
      },
    })

    // Process answers
    for (const answerData of answersData) {
      const questionId = answerData.questionId
      const question = await db.question.findUnique({
        where: { id: questionId },
      })

      if (!question) continue

      if (question.type === "TEXT" || question.type === "TEXTAREA") {
        await db.answer.create({
          data: {
            questionId,
            responseId: response.id,
            textAnswer: answerData.value,
          },
        })
      } else if (question.type === "RADIO" || question.type === "DROPDOWN") {
        await db.answer.create({
          data: {
            questionId,
            responseId: response.id,
            selectedOptionIds: [Number.parseInt(answerData.value)],
          },
        })
      } else if (question.type === "CHECKBOX") {
        await db.answer.create({
          data: {
            questionId,
            responseId: response.id,
            selectedOptionIds: answerData.value,
          },
        })
      }
    }

    // Process file uploads
    for (const [key, value] of formData.entries()) {
      if (key.startsWith("file-")) {
        const questionId = Number.parseInt(key.replace("file-", ""))
        const file = value as File

        if (!file.name) continue

        // Generate unique filename
        const fileExt = path.extname(file.name)
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}${fileExt}`
        const filePath = path.join(uploadsDir, fileName)

        // Convert file to buffer and save
        const buffer = Buffer.from(await file.arrayBuffer())
        fs.writeFileSync(filePath, buffer)

        // Create answer record with the correct file path
        await db.answer.create({
          data: {
            questionId,
            responseId: response.id,
            fileUrl: `uploads/${fileName}`, // Store the relative path without leading slash
          },
        })
      }
    }

    // Broadcast new response notification
    publish(`form-${formId}-responses`, {
      type: "new-response",
      formId,
      responseId: response.id,
      timestamp: new Date().toISOString(),
    })

    revalidatePath(`/forms/${formId}`)
    revalidatePath(`/forms/${formId}/responses`)
  } catch (error) {
    console.error("Error submitting form response:", error)
    throw new Error("Failed to submit form response")
  }
}

// Get an answer with file
export async function getAnswerWithFile(answerId: number) {
  try {
    return await db.answer.findUnique({
      where: { id: answerId },
    })
  } catch (error) {
    console.error(`Error fetching answer ${answerId}:`, error)
    return null
  }
}

// Copy a form
export async function copyForm(formId: number) {
  try {
    // Get the original form with questions and options
    const originalForm = await db.form.findUnique({
      where: { id: formId },
      include: {
        questions: {
          include: {
            options: true,
          },
          orderBy: {
            order: "asc",
          },
        },
      },
    })

    if (!originalForm) {
      throw new Error("Form not found")
    }

    // Create a new form with the same data but with "Copy of" prefix
    const newForm = await db.form.create({
      data: {
        title: `Copy of ${originalForm.title}`,
        description: originalForm.description,
        creatorId: originalForm.creatorId,
      },
    })

    // Create questions for the new form
    for (const question of originalForm.questions) {
      const newQuestion = await db.question.create({
        data: {
          formId: newForm.id,
          text: question.text,
          type: question.type,
          required: question.required,
          order: question.order,
        },
      })

      // Create options for the question if needed
      if (question.options.length > 0) {
        await db.questionOption.createMany({
          data: question.options.map((option) => ({
            questionId: newQuestion.id,
            text: option.text,
            value: option.value,
          })),
        })
      }
    }

    revalidatePath("/")
    return newForm.id
  } catch (error) {
    console.error("Error copying form:", error)
    throw new Error("Failed to copy form")
  }
}

// Delete a form
export async function deleteForm(formId: number) {
  try {
    // Get all questions for this form
    const questions = await db.question.findMany({
      where: { formId },
    })

    // Get all responses for this form
    const responses = await db.formResponse.findMany({
      where: { formId },
      include: {
        answers: true,
      },
    })

    // Delete all file uploads associated with this form
    for (const response of responses) {
      for (const answer of response.answers) {
        if (answer.fileUrl) {
          try {
            const filePath = path.join(process.cwd(), answer.fileUrl)
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath)
            }
          } catch (fileError) {
            console.error(`Error deleting file for answer ${answer.id}:`, fileError)
            // Continue with deletion even if file removal fails
          }
        }
      }
    }

    // Delete all data in a transaction
    await db.$transaction(async (tx) => {
      // Delete all options for all questions
      await tx.questionOption.deleteMany({
        where: {
          questionId: {
            in: questions.map((q) => q.id),
          },
        },
      })

      // Delete all answers for all responses
      await tx.answer.deleteMany({
        where: {
          responseId: {
            in: responses.map((r) => r.id),
          },
        },
      })

      // Delete all responses
      await tx.formResponse.deleteMany({
        where: { formId },
      })

      // Delete all questions
      await tx.question.deleteMany({
        where: { formId },
      })

      // Finally, delete the form itself
      await tx.form.delete({
        where: { id: formId },
      })
    })

    // Broadcast deletion event
    publish(`form-${formId}`, {
      type: "form-deleted",
      formId,
      timestamp: new Date().toISOString(),
    })

    revalidatePath("/")
  } catch (error) {
    console.error("Error deleting form:", error)
    throw new Error("Failed to delete form")
  }
}

// Debug function to check if a file exists
export async function checkFileExists(filePath: string) {
  try {
    const fullPath = path.join(process.cwd(), filePath)
    const exists = fs.existsSync(fullPath)
    return {
      exists,
      fullPath,
      directoryExists: fs.existsSync(path.dirname(fullPath)),
      directoryContents: fs.existsSync(path.dirname(fullPath)) ? fs.readdirSync(path.dirname(fullPath)) : [],
    }
  } catch (error) {
    return {
      exists: false,
      error: String(error),
    }
  }
}

// Register user presence in a form
export async function registerPresence(formId: number, userId: string, userName: string) {
  publish(`form-${formId}-presence`, {
    type: "user-joined",
    formId,
    user: {
      id: userId,
      name: userName,
    },
    timestamp: new Date().toISOString(),
  })

  return { success: true }
}

// Unregister user presence in a form
export async function unregisterPresence(formId: number, userId: string) {
  publish(`form-${formId}-presence`, {
    type: "user-left",
    formId,
    userId,
    timestamp: new Date().toISOString(),
  })

  return { success: true }
}
