import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { notFound } from "next/navigation"
import { getFormWithResponses } from "../actions"
import { ResponsesRealTimeIndicator } from "../../responses-realtime-indicator"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function FormResponsesPage({ params }: { params: { id: string } }) {
  const formId = Number.parseInt(params.id)
  const formWithResponses = await getFormWithResponses(formId)

  if (!formWithResponses) {
    notFound()
  }

  return (
    <div className="m-5 p-5">
<div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold">{formWithResponses.title}</h1>
        <ResponsesRealTimeIndicator formId={formId} />
      </div>      <Button><Link href={"/forms"}>
        
        Back to Forms</Link></Button><p className="text-muted-foreground mb-8">{formWithResponses.responses.length} responses received</p>

      <Tabs defaultValue="summary">
        <TabsList className="mb-6">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="individual">Individual Responses</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <div className="space-y-8">
            {formWithResponses.questions.map((question) => (
              <Card key={question.id}>
                <CardHeader>
                  <CardTitle>{question.text}</CardTitle>
                </CardHeader>
                <CardContent>
                  {question.type === "TEXT" || question.type === "TEXTAREA" ? (
                    <div className="space-y-2">
                      {formWithResponses.responses.map((response) => {
                        const answer = response.answers.find((a) => a.questionId === question.id)
                        return answer?.textAnswer ? (
                          <div key={answer.id} className="p-3 bg-muted rounded-md">
                            {answer.textAnswer}
                          </div>
                        ) : null
                      })}
                    </div>
                  ) : question.type === "FILE" ? (
                    <div className="space-y-2">
                      {formWithResponses.responses.map((response) => {
                        const answer = response.answers.find((a) => a.questionId === question.id)
                        return answer?.fileUrl ? (
                          <div key={answer.id} className="p-3 bg-muted rounded-md">
                            <a href={`/api/files/${answer.id}`} className="text-primary underline">
                              Download File
                            </a>
                          </div>
                        ) : null
                      })}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {question.options.map((option) => {
                        const count = formWithResponses.responses.filter((response) => {
                          const answer = response.answers.find((a) => a.questionId === question.id)
                          return answer?.selectedOptionIds?.includes(option.id)
                        }).length

                        const percentage =
                          formWithResponses.responses.length > 0
                            ? Math.round((count / formWithResponses.responses.length) * 100)
                            : 0

                        return (
                          <div key={option.id}>
                            <div className="flex justify-between mb-1">
                              <span>{option.text}</span>
                              <span>
                                {count} ({percentage}%)
                              </span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2.5">
                              <div className="bg-primary h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="individual">
          <div className="space-y-6">
            {formWithResponses.responses.map((response, index) => (
              <Card key={response.id}>
                <CardHeader>
                  <CardTitle>Response #{index + 1}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Submitted: {new Date(response.submittedAt).toLocaleString()}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {formWithResponses.questions.map((question) => {
                      const answer = response.answers.find((a) => a.questionId === question.id)

                      return (
                        <div key={question.id} className="border-b pb-4">
                          <h3 className="font-medium mb-2">{question.text}</h3>
                          {!answer ? (
                            <p className="text-muted-foreground italic">No answer</p>
                          ) : question.type === "TEXT" || question.type === "TEXTAREA" ? (
                            <p>{answer.textAnswer}</p>
                          ) : question.type === "FILE" ? (
                            <a href={`/api/files/${answer.id}`} className="text-primary underline">
                              Download File
                            </a>
                          ) : (
                            <div>
                              {question.options
                                .filter((option) => answer.selectedOptionIds?.includes(option.id))
                                .map((option) => (
                                  <div key={option.id} className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                                    <span>{option.text}</span>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
