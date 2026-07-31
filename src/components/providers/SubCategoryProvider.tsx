"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type SubCategoryConfig = {
  id: string;
  name: string;
  icon_name: string;
  color: string;
};

const SubCategoryContext = createContext<SubCategoryConfig[]>([]);

export const SubCategoryProvider = ({ children }: { children: React.ReactNode }) => {
  const [categories, setCategories] = useState<SubCategoryConfig[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const supabase = createClient();
      const { data, error } = await supabase.from("cfg_ticket_categories").select("*");

      if (!error && data) {
        setCategories(data as SubCategoryConfig[]);
      }
    };
    fetchCategories();
  }, []);

  return (
    <SubCategoryContext.Provider value={categories}>
      {children}
    </SubCategoryContext.Provider>
  );
};

export const useSubCategorySettings = () => {
  return useContext(SubCategoryContext);
};
