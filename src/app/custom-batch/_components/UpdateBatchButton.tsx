"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ListPlus } from "lucide-react";
import { UpdateBatchModal } from "./UpdateBatchModal";

export function UpdateBatchButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button 
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2"
        size="sm"
      >
        <ListPlus className="w-4 h-4" />
        Update Batch IDs
      </Button>
      
      <UpdateBatchModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
