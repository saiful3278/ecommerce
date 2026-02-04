"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Input from "@/app/components/atoms/Input";
import Button from "@/app/components/atoms/Button";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getSupabaseClient } from "@/app/lib/supabaseClient";

const PasswordResetWithToken = () => {
  const { handleSubmit, control } = useForm({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) return;
    const supabase = getSupabaseClient();
    setIsLoading(true);
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      setIsLoading(false);
      if (error) {
        setMessage(error.message || "Unable to validate reset link.");
        setIsError(true);
      }
    });
  }, [searchParams]);

  const onSubmit = async (formData: {
    password: string;
    confirmPassword: string;
  }) => {
    if (formData.password !== formData.confirmPassword) {
      setMessage("Passwords do not match");
      setIsError(true);
      return;
    }

    try {
      setIsLoading(true);
      const supabase = getSupabaseClient();
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setIsLoading(false);
        setMessage("Reset link expired. Please request a new one.");
        setIsError(true);
        return;
      }
      const { error } = await supabase.auth.updateUser({
        password: formData.password,
      });
      setIsLoading(false);
      if (error) {
        setMessage(error.message || "Something went wrong");
        setIsError(true);
        return;
      }
      setMessage("Password reset successful! You can now log in.");
      setIsError(false);
    } catch {
      setIsLoading(false);
      setIsError(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col items-center justify-center bg-white p-6 rounded shadow-md w-[500px] gap-4"
      >
        <h1 className="text-2xl font-bold mb-4">Reset Your Password</h1>

        {message && (
          <div
            className={`w-full text-center py-[22px] mb-4 rounded ${
              isError
                ? "bg-red-100 text-red-700 border-2 border-red-400"
                : "bg-green-100 text-green-700"
            }`}
          >
            {message}
          </div>
        )}

        <Input
          type="password"
          name="password"
          placeholder="New Password"
          control={control}
          validation={{
            required: "Password is required",
            minLength: { value: 6, message: "Minimum 6 characters" },
          }}
          className="py-4"
        />

        <Input
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          control={control}
          validation={{ required: "Confirm your password" }}
          className="py-4"
        />

        <Button
          type="submit"
          className="bg-primary mt-4 text-white w-full py-[12px] rounded"
          disabled={isLoading}
        >
          {isLoading ? "Resetting..." : "Reset Password"}
        </Button>

        <Link className="mt-4 hover:underline" href={"/sign-in"}>
          Return to sign in
        </Link>
      </form>
    </div>
  );
};

export default PasswordResetWithToken;
