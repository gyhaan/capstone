import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { farmerService } from "../services/api";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner"; // <-- NEW IMPORT

function Signup() {
  const [formData, setFormData] = useState({ full_name: "", phone_number: "", pin: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await farmerService.register(formData);
      
      // --> TRIGGER SONNER SUCCESS TOAST <--
      toast.success("Registration successful! Please login.");
      
      navigate("/login");
    } catch (err) {
      // --> TRIGGER SONNER ERROR TOAST <--
      toast.error("Registration failed. This phone number might already be in use.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold text-green-900">Create Account</CardTitle>
          <CardDescription>Join AgriGuard to start monitoring your crops.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSignup}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="Moses Kwizera" required onChange={(e) => setFormData({...formData, full_name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" placeholder="+250..." required onChange={(e) => setFormData({...formData, phone_number: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pin">Set 4-Digit PIN</Label>
              <Input id="pin" type="password" maxLength={4} placeholder="1234" required onChange={(e) => setFormData({...formData, pin: e.target.value})} />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full bg-green-700 hover:bg-green-800" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
              Create Account
            </Button>
            <p className="text-sm text-gray-500">
              Already have an account? <Link to="/login" className="text-green-700 hover:underline">Login</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default Signup;