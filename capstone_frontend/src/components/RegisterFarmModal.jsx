import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { farmerService } from "@/services/api";
import { Loader2, MapPin } from "lucide-react";
import { toast } from "sonner"; // <-- NEW IMPORT

export default function RegisterFarmModal({ isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    district: "",
    crop: "",
    planting_date: "",
    latitude: "",
    longitude: "",
    farm_size_ha: "",
  });

  const farmerId = localStorage.getItem("farmer_id");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await farmerService.registerFarm({
        farmer_id: farmerId,
        district: formData.district,
        crop: formData.crop,
        planting_date: new Date(formData.planting_date).toISOString(),
        // Convert string inputs to decimal numbers for FastAPI
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        farm_size_ha: parseFloat(formData.farm_size_ha),
      });

      // --> TRIGGER SONNER SUCCESS TOAST <--
      toast.success("Farm registered successfully!");

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to register farm:", error);
      // --> TRIGGER SONNER ERROR TOAST <--
      toast.error("Failed to register the farm. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Helper to grab browser GPS
  const handleGetLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            latitude: position.coords.latitude.toFixed(6),
            longitude: position.coords.longitude.toFixed(6),
          });
          // --> TRIGGER SONNER SUCCESS TOAST <--
          toast.success("Location acquired successfully!");
        },
        (error) => {
          // --> TRIGGER SONNER ERROR TOAST <--
          toast.error(
            "Could not get location. Please allow location access or type it manually.",
          );
        },
      );
    } else {
      // --> TRIGGER SONNER ERROR TOAST <--
      toast.error("Geolocation is not supported by your browser.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="text-green-900">
            Register New Farm
          </DialogTitle>
          <DialogDescription>
            Enter your field details and precise location for accurate AI
            monitoring.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>District</Label>
              <Select
                onValueChange={(value) =>
                  setFormData({ ...formData, district: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="District" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bugesera">Bugesera</SelectItem>
                  <SelectItem value="Burera">Burera</SelectItem>
                  <SelectItem value="Gakenke">Gakenke</SelectItem>
                  <SelectItem value="Gasabo">Gasabo</SelectItem>
                  <SelectItem value="Gatsibo">Gatsibo</SelectItem>
                  <SelectItem value="Gicumbi">Gicumbi</SelectItem>
                  <SelectItem value="Gisagara">Gisagara</SelectItem>
                  <SelectItem value="Huye">Huye</SelectItem>
                  <SelectItem value="Kamonyi">Kamonyi</SelectItem>
                  <SelectItem value="Karongi">Karongi</SelectItem>
                  <SelectItem value="Kayonza">Kayonza</SelectItem>
                  <SelectItem value="Kicukiro">Kicukiro</SelectItem>
                  <SelectItem value="Kirehe">Kirehe</SelectItem>
                  <SelectItem value="Muhanga">Muhanga</SelectItem>
                  <SelectItem value="Musanze">Musanze</SelectItem>
                  <SelectItem value="Ngoma">Ngoma</SelectItem>
                  <SelectItem value="Ngororero">Ngororero</SelectItem>
                  <SelectItem value="Nyabihu">Nyabihu</SelectItem>
                  <SelectItem value="Nyagatare">Nyagatare</SelectItem>
                  <SelectItem value="Nyamagabe">Nyamagabe</SelectItem>
                  <SelectItem value="Nyamasheke">Nyamasheke</SelectItem>
                  <SelectItem value="Nyanza">Nyanza</SelectItem>
                  <SelectItem value="Nyarugenge">Nyarugenge</SelectItem>
                  <SelectItem value="Nyaruguru">Nyaruguru</SelectItem>
                  <SelectItem value="Rubavu">Rubavu</SelectItem>
                  <SelectItem value="Ruhango">Ruhango</SelectItem>
                  <SelectItem value="Rulindo">Rulindo</SelectItem>
                  <SelectItem value="Rusizi">Rusizi</SelectItem>
                  <SelectItem value="Rutsiro">Rutsiro</SelectItem>
                  <SelectItem value="Rwamagana">Rwamagana</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Crop Type</Label>
              <Select
                onValueChange={(value) =>
                  setFormData({ ...formData, crop: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Crop" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Maize">Maize</SelectItem>
                  <SelectItem value="Beans">Beans</SelectItem>
                  <SelectItem value="Potatoes">Irish Potatoes</SelectItem>
                  <SelectItem value="Cassava">Cassava</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Planting Date</Label>
              <Input
                type="date"
                required
                onChange={(e) =>
                  setFormData({ ...formData, planting_date: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Farm Size (Hectares)</Label>
              <Input
                type="number"
                step="0.01"
                min="0.1"
                placeholder="e.g. 1.5"
                required
                onChange={(e) =>
                  setFormData({ ...formData, farm_size_ha: e.target.value })
                }
              />
            </div>
          </div>

          {/* GPS Location Section */}
          <div className="space-y-2 p-3 bg-gray-50 rounded-md border border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <Label className="font-semibold text-green-800">
                Field Coordinates
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGetLocation}
                className="text-xs h-8"
              >
                <MapPin className="h-3 w-3 mr-1" /> Use My Location
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Latitude</Label>
                <Input
                  type="number"
                  step="any"
                  placeholder="-1.9441"
                  required
                  value={formData.latitude}
                  onChange={(e) =>
                    setFormData({ ...formData, latitude: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Longitude</Label>
                <Input
                  type="number"
                  step="any"
                  placeholder="30.0619"
                  required
                  value={formData.longitude}
                  onChange={(e) =>
                    setFormData({ ...formData, longitude: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-green-700 hover:bg-green-800"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Save Farm Profile
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
