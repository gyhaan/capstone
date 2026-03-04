import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { farmerService } from "@/services/api";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner"; // <-- NEW IMPORT

export default function Login({ onLoginSuccess }) {
  const [formData, setFormData] = useState({ phone_number: "", pin: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await farmerService.login(formData);

      // Save to storage (for refresh persistence)
      localStorage.setItem("farmer_id", response.data.farmer_id);
      localStorage.setItem("full_name", response.data.full_name);

      // --> TRIGGER SONNER SUCCESS TOAST <--
      toast.success(`Welcome back, ${response.data.full_name}!`);

      // Update the App's state (for immediate redirect)
      onLoginSuccess(response.data.farmer_id);

      navigate("/");
    } catch (err) {
      setError("Invalid credentials");
      // --> TRIGGER SONNER ERROR TOAST <--
      toast.error("Login failed. Please check your phone number and PIN.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-green-900 text-center">
            Farmer Login
          </CardTitle>
          <CardDescription className="text-center">
            Enter your details to access your farm health.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {error && (
              <p className="text-sm font-medium text-red-500 text-center">
                {error}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="+250..."
                required
                onChange={(e) =>
                  setFormData({ ...formData, phone_number: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pin">4-Digit PIN</Label>
              <Input
                id="pin"
                type="password"
                maxLength={4}
                placeholder="****"
                required
                onChange={(e) =>
                  setFormData({ ...formData, pin: e.target.value })
                }
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button
              className="w-full bg-green-700 hover:bg-green-800"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Lock className="mr-2 h-4 w-4" />
              )}
              Login
            </Button>
            <p className="text-sm text-gray-500">
              Don't have an account?{" "}
              <Link to="/signup" className="text-green-700 hover:underline">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}