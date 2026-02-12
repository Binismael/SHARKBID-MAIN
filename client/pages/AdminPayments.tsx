import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { Check, AlertCircle, DollarSign } from "lucide-react";
import { getPayments, updatePaymentStatus } from "@/lib/admin-service";
import { useAuth } from "@/lib/auth-context";

interface Payment {
  id: string;
  creator?: { name: string; email: string };
  milestone?: { title: string };
  project?: { title: string };
  amount: number;
  status: "pending" | "paid";
  due_date: string;
  created_at: string;
}

export default function AdminPayments() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getPayments();
        if (data && Array.isArray(data)) {
          setPayments(data);
        } else {
          setPayments([]);
        }
      } catch (error) {
        console.error("Error fetching payments:", error);
        setError("Failed to load payments. Please try refreshing the page.");
        setPayments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
    // Refresh payments every 30 seconds for live data
    const interval = setInterval(fetchPayments, 30000);
    return () => clearInterval(interval);
  }, []);

  const statusColors: Record<string, string> = {
    pending: "bg-accent/20 text-accent",
    paid: "bg-secondary/20 text-secondary",
  };

  const displayPayments = payments;

  const filteredPayments = displayPayments.filter((p) => {
    const creatorName = p.creator?.name || "";
    const projectName = p.project?.title || "";
    const milestoneName = p.milestone?.title || "";
    const matchesSearch =
      creatorName.toLowerCase().includes(search.toLowerCase()) ||
      projectName.toLowerCase().includes(search.toLowerCase()) ||
      milestoneName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "all" || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    pending: displayPayments
      .filter((p) => p.status === "pending")
      .reduce((sum, p) => sum + p.amount, 0),
    paid: displayPayments
      .filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + p.amount, 0),
    total: displayPayments.reduce((sum, p) => sum + p.amount, 0),
  };

  const handleMarkPaid = async (paymentId: string) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      await updatePaymentStatus(paymentId, "paid", today);
      setPayments(
        payments.map((p) =>
          p.id === paymentId ? { ...p, status: "paid" } : p
        )
      );
    } catch (error) {
      console.error("Error updating payment:", error);
      alert("Failed to mark payment as paid");
    }
  };

  return (
    <DashboardLayout role="admin" userName={user?.email || "Admin"}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Payment Management</h1>
            <p className="text-muted-foreground">
              Process creator payments and track payment status ({displayPayments.length} total)
              {loading && <span className="ml-2 text-xs">(updating...)</span>}
            </p>
          </div>
          <button
            onClick={() => {
              setLoading(true);
              getPayments().then((data) => {
                if (data && Array.isArray(data)) {
                  setPayments(data);
                }
                setLoading(false);
              });
            }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            title="Refresh payments"
          >
            ↻ Refresh
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">
                    ${stats.pending.toLocaleString()}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-accent" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {displayPayments.filter((p) => p.status === "pending").length} payments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Paid</p>
                  <p className="text-2xl font-bold">
                    ${stats.paid.toLocaleString()}
                  </p>
                </div>
                <Check className="h-8 w-8 text-secondary" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {displayPayments.filter((p) => p.status === "paid").length} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">
                    ${stats.total.toLocaleString()}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-accent" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <Input
            placeholder="Search by creator, project, or milestone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-input rounded-md bg-background text-foreground"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
          </select>
        </div>

        {/* Payments Table */}
        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <p className="text-muted-foreground">Loading payments...</p>
            ) : filteredPayments.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                {displayPayments.length === 0 ? "No payments yet." : "No payments match your search."}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                        Creator
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                        Milestone
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                        Project
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                        Amount
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                        Due Date
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map((payment) => (
                      <tr
                        key={payment.id}
                        className="border-b border-border hover:bg-muted/50 transition"
                      >
                        <td className="py-4 px-4 text-sm font-medium">
                          {payment.creator?.name || "Unknown"}
                        </td>
                        <td className="py-4 px-4 text-sm">
                          {payment.milestone?.title || "No milestone"}
                        </td>
                        <td className="py-4 px-4 text-sm text-muted-foreground">
                          {payment.project?.title || "Unknown"}
                        </td>
                        <td className="py-4 px-4 text-sm font-semibold">
                          ${payment.amount.toLocaleString()}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`text-xs font-medium px-2 py-1 rounded inline-block ${
                              statusColors[payment.status]
                            }`}
                          >
                            {payment.status.charAt(0).toUpperCase() +
                              payment.status.slice(1)}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm">
                          {new Date(payment.due_date).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4 text-right">
                          {payment.status === "pending" && (
                            <Button
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => handleMarkPaid(payment.id)}
                            >
                              Mark Paid
                            </Button>
                          )}
                          {payment.status === "paid" && (
                            <span className="text-xs text-secondary font-medium">
                              ✓ Paid
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
