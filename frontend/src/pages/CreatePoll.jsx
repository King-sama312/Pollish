import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import api from "../utils/intercept.js";
import { QRCodeSVG } from "qrcode.react";

export default function CreatePoll() {
  const navigate = useNavigate();
  const [createdPollId, setCreatedPollId] = useState(null);
  const [copied, setCopied] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: {errors, isSubmitting}
  } = useForm({
    defaultValues: {
      question: "",
      description: "",
      isAnonymous: false,
      isActive: true,
      endsAt: "",
      options: [{ text: "" }, { text: "" }],
    },
  });

  const {fields, append, remove} = useFieldArray({
    control,
    name: "options"
  })
  
  const onSubmit = async(data)=>{
    try {
        const payload = {
            ...data,
            options: data.options.map((o)=> o.text.trim()).filter((t)=> t.length >0),
            endsAt: data.endsAt? new Date(data.endsAt).toISOString() : null,   
        }

        if(payload.options.length <2){
            alert("Please provide atleast 2 options.")
            return
        }

        const res = await api.post("/polls/create", payload);
        setCreatedPollId(res.data.data.poll.id);
    } catch (err) {
        console.error(err)
        alert(err.response?.data?.message||  "Failed to create poll")
    }
  }

  const copyLink = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (createdPollId) {
    const voteUrl = `${window.location.origin}/polls/${createdPollId}/vote`;
    return (
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "2rem 0" }}>
        <div style={{ textAlign: "center", padding: "4rem 2rem", background: "white", borderRadius: "16px", border: "1px solid var(--surface-border)" }}>
          <div style={{ width: "80px", height: "80px", background: "black", color: "white", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 2rem auto", fontSize: "2.5rem" }}>
            ✓
          </div>
          <h2 style={{ marginBottom: "1rem", fontSize: "2rem" }}>Poll Created!</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "3rem", fontSize: "1.1rem" }}>
            Your poll is ready. Share the link or QR code below to start collecting real opinions.
          </p>

          <div style={{ display: "inline-block", padding: "1.5rem", background: "#fff", borderRadius: "16px", border: "1px solid var(--surface-border)", marginBottom: "2rem" }}>
            <QRCodeSVG value={voteUrl} size={200} level="M" />
          </div>

          <div style={{ display: "flex", gap: "0.5rem", maxWidth: "100%", margin: "0 auto 3rem auto" }}>
            <input
              type="text"
              readOnly
              value={voteUrl}
              onClick={(e) => e.target.select()}
              style={{ flex: 1, fontFamily: "monospace", fontSize: "0.875rem" }}
            />
            <button onClick={() => copyLink(voteUrl)} style={{ padding: "0 1.5rem" }}>
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
            <button className="secondary-btn" onClick={() => navigate("/dashboard")} style={{ padding: "0.75rem 2rem" }}>
              Go to Dashboard
            </button>
            <button onClick={() => navigate(`/polls/${createdPollId}/results`)} style={{ padding: "0.75rem 2rem" }}>
              View Live Results
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "600px", margin: "0" }}>
      <h1 style={{ marginBottom: "2rem", fontSize: "1.75rem" }}>Create Poll</h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="input-group">
          <label>Question</label>
          <input
            type="text"
            {...register("question", { required: "Question is required" })}
            placeholder="What's your favorite season?"
            style={{ fontSize: "1.1rem", padding: "1rem" }}
          />
          {errors.question && <div className="text-error">{errors.question.message}</div>}
        </div>

        <div className="input-group">
          <label>Options</label>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {fields.map((field, index) => (
              <div key={field.id} style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  type="text"
                  {...register(`options.${index}.text`, {
                    required: "Option text required",
                  })}
                  placeholder={
                    index === 0 ? "Spring" : index === 1 ? "Summer" : index === 2 ? "Autumn" : index === 3 ? "Winter" : `Option ${index + 1}`
                  }
                />
                {fields.length > 2 && (
                  <button type="button" className="secondary-btn" onClick={() => remove(index)} style={{ padding: "0 1rem", border: "none", color: "var(--text-secondary)" }}>
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            className="secondary-btn"
            onClick={() => append({ text: "" })}
            style={{ marginTop: "1rem", border: "none", padding: 0, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            + Add Option
          </button>
        </div>

        <div style={{ marginTop: "3rem", borderTop: "1px solid var(--surface-border)", paddingTop: "2rem" }}>
          <h3 style={{ fontSize: "1rem", marginBottom: "1.5rem" }}>Poll Settings</h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: 0, cursor: "pointer", fontWeight: 500 }}>
              <span>Anonymous Voting <span style={{display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 400}}>Allow votes without an account</span></span>
              <input type="checkbox" {...register("isAnonymous")} style={{ width: "1.25rem", height: "1.25rem" }} />
            </label>

            <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: 0, cursor: "pointer", fontWeight: 500 }}>
              <span>Active Immediately <span style={{display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 400}}>People can vote right now</span></span>
              <input type="checkbox" {...register("isActive")} style={{ width: "1.25rem", height: "1.25rem" }} />
            </label>

            <div>
              <label style={{ display: "block", fontWeight: 500, marginBottom: "0.5rem" }}>Set end date (optional)</label>
              <input
                type="datetime-local"
                {...register("endsAt")}
              />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "1rem", marginTop: "3rem", justifyContent: "flex-end", borderTop: "1px solid var(--surface-border)", paddingTop: "2rem" }}>
          <button type="button" className="secondary-btn" onClick={() => navigate("/dashboard")} style={{ padding: "0.875rem 2rem" }}>
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{ padding: "0.875rem 2rem" }}
          >
            {isSubmitting ? "Creating..." : "Create Poll"}
          </button>
        </div>
      </form>
    </div>
  )
}
