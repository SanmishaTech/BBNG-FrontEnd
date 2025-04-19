import { useEffect } from "react"; // Removed useState as it's not needed for isLoading
import { useLocation, useNavigate } from "react-router-dom";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { post } from "@/services/apiService";
import { appName, allowRegistration } from "@/config";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { ZodError, ZodIssue } from "zod";
import { handleApiValidationErrors } from "@/lib/Handlevalidation";

//
// 1. Define the shape of what your backend is returning
//
interface BackendErrorResponse {
  errors: Array<{
    path: Array<string | number>;
    message: string;
  }>;
}

//
// 2. Convert each backend error into a ZodIssue
//
function mapBackendErrorToIssue(err: BackendErrorResponse): ZodIssue[] {
  console.log(err);
  return err.error.map(({ path, message }) => ({
    // you can choose a more specific code if you like,
    // but "custom" is fine for server‐side messages
    code: "custom" as const,
    path,
    message,
  }));
}
function getZodIssuesFromBackend(err: BackendErrorResponse): ZodIssue[] {
  return mapBackendErrorToIssue(err);
}
function throwAsZodError(err: BackendErrorResponse): never {
  const issues = mapBackendErrorToIssue(err);
  throw new ZodError(issues);
}
// Define expected API response structure for SUCCESS
interface LoginResponse {
  token: string;
  accesstoken: string;
  user: {
    id: string;
    email: string;
    // ... other user fields
  };
}

// Define structure for individual field validation errors from API
interface FieldValidationError {
  path: string[]; // Expecting path like ["email"] or ["password"]
  message: string;
}

// Define the structure of the API error response BODY for VALIDATION errors (status 400)
interface ApiValidationErrorResponse {
  status: number;
  error: FieldValidationError[];
  message: string; // General message like "Request failed" or "Validation Error"
}

// Define a more general API error structure for other errors (e.g., 401, 500)
// This depends on how your apiService formats errors. We assume it might throw
// an object with a 'message' property for non-validation errors.
interface ApiGeneralError extends Error {
  // Can still extend Error
  message: string;
  status?: number; // Optional status if available
  // Include other potential properties your apiService might add
}

type LoginFormInputs = z.infer<typeof loginSchema>;

const loginSchema = z.object({
  email: z.string().email("Invalid email address").min(1, "Email is required"),

  password: z.string().min(1, "Password is required"),
});

const Login = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Get setError from useForm
  const {
    register,
    handleSubmit,
    setError, // <-- Destructure setError
    formState: { errors },
    // getValues // Can be useful for debugging
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (location.state?.unauthorized) {
      toast.error("You are not authorized.");
      setTimeout(() => {
        navigate(location.pathname, { replace: true, state: {} });
      }, 0);
    }
  }, [location, navigate]);

  const loginMutation = useMutation<
    LoginResponse,
    unknown, // Use unknown for error type, as we'll check its structure
    LoginFormInputs
  >({
    mutationFn: async (loginData: LoginFormInputs) => {
      return await post("/auth/login", loginData);
    },
    onSuccess: (data) => {
      console.log("Login successful:", data);
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("refreshToken", data.accesstoken);
      localStorage.setItem("user", JSON.stringify(data.user));
      // queryClient.invalidateQueries(...) // Consider invalidating relevant queries
      navigate("/dashboard");
      toast.success("Login successful!");
    },
    onError: (error: unknown) => {
      Validate(error, setError);
      // console.log(error);
      // throwAsZodError(error);
      console.error("Login error details:", error);
    },
  });

  const onSubmit: SubmitHandler<LoginFormInputs> = (data) => {
    // Optionally log data being sent: console.log("Submitting:", data);
    loginMutation.mutate(data);
  };

  const isLoading = loginMutation.isPending;

  return (
    // When submitting, RHF first runs Zod validation. If that passes, onSubmit is called.
    // If Zod fails, its errors show up in the `errors` object immediately.
    // If Zod passes but the server returns validation errors, our `onError` handler
    // calls `setError`, which also updates the `errors` object.
    <form className="p-6 md:p-8" onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col items-center text-center">
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-balance text-muted-foreground">
            Login to your {appName} account
          </p>
        </div>

        {/* Email Field */}
        <div className="grid gap-2 relative pb-3">
          {" "}
          {/* Added pb-3 for error spacing */}
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            {...register("email")} // RHF validation triggers on change/blur
            required
            disabled={isLoading}
            aria-invalid={errors.email ? "true" : "false"} // Accessibility
          />
          {/* Display RHF errors (client OR server-set) */}
          {errors.email && (
            <p className="text-destructive text-xs absolute -bottom-1 left-0">
              {" "}
              {/* Adjusted positioning */}
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="grid gap-2 relative pb-3">
          {" "}
          {/* Added pb-3 for error spacing */}
          <div className="flex items-center">
            <Label htmlFor="password">Password</Label>
            <a
              href="/forgot-password"
              tabIndex={isLoading ? -1 : 0} // Prevent tabbing when disabled
              className="ml-auto text-sm underline-offset-2 hover:underline"
            >
              Forgot your password?
            </a>
          </div>
          <PasswordInput
            id="password"
            {...register("password")} // RHF validation triggers on change/blur
            required
            disabled={isLoading}
            aria-invalid={errors.password ? "true" : "false"} // Accessibility
          />
          {/* Display RHF errors (client OR server-set) */}
          {errors.password && (
            <p className="text-destructive text-xs absolute -bottom-1 left-0">
              {" "}
              {/* Adjusted positioning */}
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              Logging in...
            </>
          ) : (
            "Login"
          )}
        </Button>

        {/* Registration Link */}
        {allowRegistration && (
          <div className="text-center text-sm">
            Don't have an account?{" "}
            <a href="/register" className="underline underline-offset-4">
              Register
            </a>
          </div>
        )}
      </div>
    </form>
  );
};

export default Login;
