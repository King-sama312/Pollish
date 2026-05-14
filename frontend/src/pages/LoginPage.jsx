import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import api from "../utils/intercept.js";
function LoginPage() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    getValues,
  } = useForm({ mode: "onTouched" });

  async function submit(data) {
    try {
      const res = await api.post("/auth/login", data); // no manual headers needed
      // const result = res.data;
      // console.log(result.data.accessToken);

      // localStorage.setItem("accessToken", result.data.accessToken);
      navigate("/me");
    } catch (error) {
      const message = error.response?.data?.message || "Something went wrong";
      setError("root", { message });
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit(submit)}>
        <label>
          Email
          <input {...register("email", { required: "email is required" })} />
        </label>
        <label>
          Password
          <input
            {...register("password", {
              required: "Password is required",
              minLength: {
                value: 8,
                message: "Password must be at least 8 characters long",
              },
            })}
          />
        </label>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit"}
        </button>
      </form>
    </div>
  );
}

export default LoginPage;
