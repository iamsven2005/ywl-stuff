import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { assignUsersToEmailTemplate, removeUsersFromEmailTemplate, updateEmailTemplate, createEmailTemplate } from "@/app/actions/email-template-actions";
import { getUsers } from "@/app/actions/user-actions";
import { MultiSelect } from "./multi-select";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  subject: z.string().min(2, "Subject must be at least 2 characters."),
  body: z.string().min(10, "Body must be at least 10 characters."),
  assignedUsers: z.array(z.string()).optional(),
});

interface User {
  id: number;
  username: string;
}

interface EmailTemplateFormProps {
  template?: {
    id: number;
    name: string;
    subject: string;
    body: string;
    assignedUsers: User[];
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function EmailTemplateForm({ template, onSuccess, onCancel }: EmailTemplateFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    async function fetchUsers() {
        try {
            const { users } = await getUsers({ page: 1, pageSize: 50 }); // Provide default values
            setUsers(users);
        } catch (error) {
            toast.error("Failed to load users.");
        }
    }
    fetchUsers();
}, []);


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: template?.name || "",
      subject: template?.subject || "",
      body: template?.body || "",
      assignedUsers: template ? template.assignedUsers.map((u) => String(u.id)) : [],
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      if (template) {
        // Update existing template
        await updateEmailTemplate({ id: template.id, ...values });

        // Update assigned users
        const newUserIds = values.assignedUsers?.map(Number) || [];
        const oldUserIds = template.assignedUsers.map((u) => u.id);

        const usersToAdd = newUserIds.filter((id) => !oldUserIds.includes(id));
        const usersToRemove = oldUserIds.filter((id) => !newUserIds.includes(id));

        if (usersToAdd.length) await assignUsersToEmailTemplate(template.id, usersToAdd);
        if (usersToRemove.length) await removeUsersFromEmailTemplate(template.id, usersToRemove);

        toast.success("Email template updated successfully.");
      } else {
        // Create new template
        const userIds = values.assignedUsers?.map(Number) || [];
        const { emailTemplate } = await createEmailTemplate({ ...values, assignedUsers: userIds });
        
        // Assign users if any were selected
        if (values.assignedUsers && values.assignedUsers.length > 0) {
          await assignUsersToEmailTemplate(emailTemplate.id, values.assignedUsers.map(Number));
        }

        toast.success("Email template created successfully.");
      }

      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to save email template.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Template Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., High CPU Alert" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="subject"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Subject</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Alert: High CPU Usage Detected" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="body"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Body</FormLabel>
              <FormControl>
                <Textarea placeholder="Dear {{user}}, We detected high CPU usage on {{device}} at {{time}}..." className="min-h-[200px]" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* User Assignment Field */}
        <FormField
          control={form.control}
          name="assignedUsers"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assign Users</FormLabel>
              <FormControl>
                <MultiSelect
                  options={users.map((user) => ({ label: user.username, value: String(user.id) }))}
                  value={field.value || []}
                  onChange={field.onChange}
                  placeholder="Select users..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : template ? "Update Template" : "Create Template"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
