import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import axios from "axios";
import api from "../utils/intercept";


function RegisterPage() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitSuccessful, isSubmitting },
    setError,
    getValues,
  } = useForm({ defaultValues: { name: "Your name" }, mode: "onTouched" });

  async function submit(data) {
    try {
      const res = await api.post("/auth/register", data);

      const result = res.data;
      navigate("/login");
    } catch (error) {
      const message = error.response?.data?.message || "Something went wrong";
      setError("root", { message });
    }
  }

  if (isSubmitSuccessful) {
    return (
      <div>
        <h1>Form submitted successfully</h1>
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit(submit)}>
        <label>
          Full name
          <input {...register("name", { required: " name is required" })} />
          {errors.name && <span>{errors.name.message}</span>}
        </label>
        <label>
          Email
          <input {...register("email", { required: "email is required" })} />
        </label>
        <label>
          Password
          <input
            {...register("password", {
              required: "password must be atleat 8 characters long",
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

export default RegisterPage;
