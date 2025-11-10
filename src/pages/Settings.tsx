import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings as SettingsIcon, Globe, DollarSign } from "lucide-react";
import PaysManagement from "@/components/settings/PaysManagement";
import TarifsManagement from "@/components/settings/TarifsManagement";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("pays");

  return (
    <div className="p-6 md:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
          <SettingsIcon className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>
          <p className="text-muted-foreground">
            Gérez les pays et les tarifs CBM
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Card className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="pays" className="gap-2">
              <Globe className="w-4 h-4" />
              Pays
            </TabsTrigger>
            <TabsTrigger value="tarifs" className="gap-2">
              <DollarSign className="w-4 h-4" />
              Tarifs CBM
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pays" className="mt-6">
            <PaysManagement />
          </TabsContent>

          <TabsContent value="tarifs" className="mt-6">
            <TarifsManagement />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Settings;
