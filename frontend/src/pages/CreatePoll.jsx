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
      <div className="page-container">
        <div className="glass-panel" style={{ textAlign: "center", padding: "3rem 2rem" }}>
          <div style={{ width: "64px", height: "64px", background: "rgba(16, 185, 129, 0.2)", color: "#10b981", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem auto", fontSize: "2rem" }}>
            ✓
          </div>
          <h2 style={{ marginBottom: "1rem" }}>Poll Created Successfully!</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>
            Your poll is ready. Share the link or QR code below to start collecting votes.
          </p>

          <div style={{ display: "inline-block", padding: "1rem", background: "#fff", borderRadius: "12px", marginBottom: "1.5rem" }}>
            <QRCodeSVG value={voteUrl} size={180} level="M" />
          </div>

          <div style={{ display: "flex", gap: "0.5rem", maxWidth: "500px", margin: "0 auto 2rem auto" }}>
            <input
              type="text"
              readOnly
              value={voteUrl}
              onClick={(e) => e.target.select()}
              style={{ flex: 1, fontFamily: "monospace" }}
            />
            <button onClick={() => copyLink(voteUrl)}>
              {copied ? "Copied! ✓" : "Copy"}
            </button>
          </div>

          <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
            <button className="secondary-btn" onClick={() => navigate("/dashboard")}>
              Go to Dashboard
            </button>
            <button onClick={() => navigate(`/polls/${createdPollId}/results`)}>
              View Live Results
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="glass-panel">
        <h1 style={{ marginBottom: "2rem" }}>Create a Poll</h1>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="input-group">
            <label>Question *</label>
            <input
              type="text"
              {...register("question", { required: "Question is required" })}
              placeholder="e.g. What's your favorite color?"
            />
            {errors.question && <div className="text-error">{errors.question.message}</div>}
          </div>

          <div className="input-group">
            <label>Description</label>
            <textarea
              {...register("description")}
              placeholder="Optional context..."
              rows={3}
            />
          </div>

          <div className="input-group" style={{ display: "flex", gap: "2rem", flexWrap: "wrap", padding: "1rem", background: "rgba(0,0,0,0.2)", borderRadius: "8px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: 0, cursor: "pointer" }}>
              <input type="checkbox" {...register("isAnonymous")} style={{ width: "auto" }} />
              Anonymous Voting
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: 0, cursor: "pointer" }}>
              <input type="checkbox" {...register("isActive")} style={{ width: "auto" }} />
              Active Immediately
            </label>
          </div>

          <div className="input-group">
            <label>Ends At (optional)</label>
            <input
              type="datetime-local"
              {...register("endsAt")}
            />
          </div>

          <div className="input-group">
            <label>Options *</label>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {fields.map((field, index) => (
                <div key={field.id} style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    type="text"
                    {...register(`options.${index}.text`, {
                      required: "Option text required",
                    })}
                    placeholder={`Option ${index + 1}`}
                  />
                  {fields.length > 2 && (
                    <button type="button" className="secondary-btn" onClick={() => remove(index)}>
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
              style={{ marginTop: "1rem" }}
            >
              + Add Option
            </button>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{ width: "100%", marginTop: "1rem", padding: "1rem", fontSize: "1.1rem" }}
          >
            {isSubmitting ? "Creating..." : "Launch Poll 🚀"}
          </button>
        </form>
      </div>
    </div>
  )
}
