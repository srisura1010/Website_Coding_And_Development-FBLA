"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import emailjs from "@emailjs/browser";
import { SUPER_ADMINS } from "@/lib/superAdmin";

interface AdminRequest {
  id: string;
  name: string;
  email: string;
  school: string;
  teacher_id: string;
  extra_info: string;
  id_image_url: string;
  status: string;
  submitted_at: string;
}

function generatePassword(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from(crypto.getRandomValues(new Uint8Array(10)))
    .map((b) => chars[b % chars.length])
    .join("");
}

export default function SuperAdminPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const userEmail = user?.primaryEmailAddress?.emailAddress ?? "";
  const isSuperAdmin = SUPER_ADMINS.includes(userEmail);

  useEffect(() => {
    if (isLoaded && !isSuperAdmin) {
      router.push("/");
    }
  }, [isLoaded, isSuperAdmin, router]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    fetchRequests();
  }, [isSuperAdmin]);

  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("admin_requests")
      .select("*")
      .order("submitted_at", { ascending: false });
    if (!error && data) setRequests(data);
    setLoading(false);
  };

  const handleApprove = async (request: AdminRequest) => {
    setApprovingId(request.id);
    try {
      const { data: existing } = await supabase
        .from("admins")
        .select("id")
        .eq("email", request.email)
        .maybeSingle();

      if (existing) {
        alert("This person is already an admin.");
        return;
      }

      const password = generatePassword();

      const { error: insertError } = await supabase.from("admins").insert({
        name: request.name,
        email: request.email,
        password,
      });
      if (insertError) throw insertError;

      await supabase
        .from("admin_requests")
        .update({ status: "approved" })
        .eq("id", request.id);

      await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
        process.env.NEXT_PUBLIC_EMAILJS_ADMIN_TEMPLATE_ID!,
        { name: request.name, email: request.email, password },
        process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!
      );

      setRequests((prev) =>
        prev.map((r) => (r.id === request.id ? { ...r, status: "approved" } : r))
      );

      alert(`✅ Approved! Password sent to ${request.email}`);
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Check the console.");
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setRejectingId(id);
    await supabase
      .from("admin_requests")
      .update({ status: "rejected" })
      .eq("id", id);
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "rejected" } : r))
    );
    setRejectingId(null);
  };

  const handleRemoveAdmin = async (email: string, requestId: string) => {
    if (
      !confirm(
        `Remove admin access for ${email}? Their password will stop working immediately.`
      )
    )
      return;
    setRemovingId(requestId);
    try {
      const { error } = await supabase.from("admins").delete().eq("email", email);
      if (error) throw error;
      // Also revert the request status back to "pending" so they'd need to re-apply
      await supabase
        .from("admin_requests")
        .update({ status: "removed" })
        .eq("id", requestId);
      setRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status: "removed" } : r))
      );
      alert(`✅ Admin access removed for ${email}`);
    } catch (err) {
      console.error(err);
      alert("Something went wrong removing admin.");
    } finally {
      setRemovingId(null);
    }
  };

  if (!isLoaded || !isSuperAdmin) return null;

  const pending = requests.filter((r) => r.status === "pending");
  const reviewed = requests.filter((r) => r.status !== "pending");

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Super Admin</h1>
          <p style={styles.subtitle}>Manage admin requests for Findr</p>
        </div>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>
            Pending <span style={styles.badge}>{pending.length}</span>
          </h2>
          {loading ? (
            <p style={styles.empty}>Loading...</p>
          ) : pending.length === 0 ? (
            <p style={styles.empty}>No pending requests 🎉</p>
          ) : (
            pending.map((r) => (
              <RequestCard
                key={r.id}
                request={r}
                onApprove={() => handleApprove(r)}
                onReject={() => handleReject(r.id)}
                approving={approvingId === r.id}
                rejecting={rejectingId === r.id}
              />
            ))
          )}
        </section>

        {reviewed.length > 0 && (
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Reviewed</h2>
            {reviewed.map((r) => (
              <RequestCard
                key={r.id}
                request={r}
                reviewed
                onRemove={
                  r.status === "approved"
                    ? () => handleRemoveAdmin(r.email, r.id)
                    : undefined
                }
                removing={removingId === r.id}
              />
            ))}
          </section>
        )}
      </div>
    </div>
  );
}

function RequestCard({
  request,
  onApprove,
  onReject,
  approving,
  rejecting,
  reviewed,
  onRemove,
  removing,
}: {
  request: AdminRequest;
  onApprove?: () => void;
  onReject?: () => void;
  approving?: boolean;
  rejecting?: boolean;
  reviewed?: boolean;
  onRemove?: () => void;
  removing?: boolean;
}) {
  const statusColor =
    request.status === "approved"
      ? "#16a34a"
      : request.status === "rejected"
      ? "#dc2626"
      : request.status === "removed"
      ? "#6b7280"
      : "#d97706";

  return (
    <div style={styles.card}>
      <div style={styles.cardTop}>
        <div>
          <p style={styles.cardName}>{request.name}</p>
          <p style={styles.cardEmail}>{request.email}</p>
        </div>
        <span style={{ ...styles.status, color: statusColor }}>
          {request.status.toUpperCase()}
        </span>
      </div>

      <div style={styles.cardDetails}>
        <Detail label="School" value={request.school} />
        <Detail label="Teacher ID" value={request.teacher_id} />
        {request.extra_info && (
          <Detail label="Extra Info" value={request.extra_info} />
        )}
        <Detail
          label="Submitted"
          value={new Date(request.submitted_at).toLocaleDateString()}
        />
      </div>

      {request.id_image_url && (
        <a
          href={request.id_image_url}
          target="_blank"
          rel="noreferrer"
          style={styles.imageLink}
        >
          View ID Photo ↗
        </a>
      )}

      {!reviewed && (
        <div style={styles.cardActions}>
          <button
            style={styles.approveBtn}
            onClick={onApprove}
            disabled={approving}
          >
            {approving ? "Approving..." : "✓ Approve"}
          </button>
          <button
            style={styles.rejectBtn}
            onClick={onReject}
            disabled={rejecting}
          >
            {rejecting ? "Rejecting..." : "✕ Reject"}
          </button>
        </div>
      )}

      {reviewed && onRemove && (
        <div style={styles.cardActions}>
          <button
            style={styles.removeBtn}
            onClick={onRemove}
            disabled={removing}
          >
            {removing ? "Removing..." : "✕ Remove Admin"}
          </button>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.detail}>
      <span style={styles.detailLabel}>{label}:</span>
      <span style={styles.detailValue}>{value}</span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f9fafb",
    padding: "40px 16px",
    fontFamily: "'Geist', system-ui, sans-serif",
  },
  container: { maxWidth: 720, margin: "0 auto" },
  header: { marginBottom: 32 },
  title: { fontSize: 28, fontWeight: 700, margin: 0, color: "#111" },
  subtitle: { color: "#6b7280", marginTop: 4, fontSize: 14 },
  section: { marginBottom: 40 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: "#374151",
    marginBottom: 12,
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  badge: {
    background: "#fee2e2",
    color: "#dc2626",
    borderRadius: 999,
    padding: "2px 8px",
    fontSize: 12,
    fontWeight: 700,
  },
  empty: { color: "#9ca3af", fontSize: 14 },
  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: "20px 24px",
    marginBottom: 12,
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  cardName: { fontWeight: 600, fontSize: 16, margin: 0, color: "#111" },
  cardEmail: { color: "#6b7280", fontSize: 13, margin: "2px 0 0" },
  status: { fontSize: 11, fontWeight: 700, letterSpacing: 1 },
  cardDetails: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    marginBottom: 12,
  },
  detail: { fontSize: 13, color: "#374151" },
  detailLabel: { fontWeight: 600, marginRight: 6, color: "#6b7280" },
  detailValue: { color: "#111" },
  imageLink: {
    fontSize: 13,
    color: "#2563eb",
    textDecoration: "none",
    display: "inline-block",
    marginBottom: 12,
  },
  cardActions: { display: "flex", gap: 8, marginTop: 8 },
  approveBtn: {
    background: "#16a34a",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "8px 18px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  rejectBtn: {
    background: "#fff",
    color: "#dc2626",
    border: "1px solid #dc2626",
    borderRadius: 8,
    padding: "8px 18px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  removeBtn: {
    background: "#fff",
    color: "#dc2626",
    border: "1px solid #dc2626",
    borderRadius: 8,
    padding: "8px 18px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
};