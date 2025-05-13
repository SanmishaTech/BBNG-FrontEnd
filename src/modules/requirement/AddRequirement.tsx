import React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

import { createRequirement } from "@/services/requirementService";

const requirementSchema = z.object({
  heading: z.string().min(1, "Heading is required").max(100, "Heading must be 100 characters or less"),
  requirement: z.string().min(1, "Requirement is required").max(513, "Requirement must be 513 characters or less"),
});

type RequirementFormValues = z.infer<typeof requirementSchema>;

const AddRequirement: React.FC = () => {
  const navigate = useNavigate();
  const form = useForm<RequirementFormValues>({
    resolver: zodResolver(requirementSchema),
    defaultValues: {
      heading: "",
      requirement: "",
    },
  });

  const addMutation = useMutation({
    mutationFn: async (data: RequirementFormValues) => {
      const memberIdStr = localStorage.getItem("memberId");
      if (!memberIdStr) {
        throw new Error("Member ID not found in local storage");
      }
      const memberId = parseInt(memberIdStr, 10);
      return createRequirement({ memberId, ...data });
    },
    onSuccess: () => {
      toast.success("Requirement added successfully");
      form.reset();
      navigate("/viewrequirements");
    },
    onError: (error: any) => {
      toast.error(error.errors?.message || error.message || "Failed to add requirement");
    },
  });

  const onSubmit = (values: RequirementFormValues) => {
    addMutation.mutate(values);
  };

  return (
    <div className="p-6 max-w-3xl w-full mx-auto bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen flex items-start justify-center">
      <Card className="w-full border rounded-lg shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-transform bg-white">
        <CardHeader>
          <CardTitle>Add Requirement</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="heading"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Heading</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter heading" maxLength={100} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="requirement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requirement</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter requirement" maxLength={513} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={addMutation.isPending}>
                {addMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddRequirement;
