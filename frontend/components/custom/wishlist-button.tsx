"use client";

import { useState } from "react";
import { HeartIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  useCheckWishlistStatusQuery,
  useAddToWishlistMutation,
  useRemoveFromWishlistMutation,
} from "@/lib/features/wishlist/wishlistApi";
import { toast } from "@/components/ui/toast";

interface WishlistButtonProps {
  symbol: string;
  name: string;
  exchange: string;
  className?: string;
  size?: number;
}

export function WishlistButton({
  symbol,
  name,
  exchange,
  className,
  size = 18,
}: WishlistButtonProps) {
  const { data: statusData, isLoading: isChecking } =
    useCheckWishlistStatusQuery(symbol);
  const [addToWishlist, { isLoading: isAdding }] = useAddToWishlistMutation();
  const [removeFromWishlist, { isLoading: isRemoving }] =
    useRemoveFromWishlistMutation();

  const isWishlisted = statusData?.isWishlisted || false;
  const isLoading = isChecking || isAdding || isRemoving;

  const toggleWishlist = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    if (isLoading) return;

    try {
      if (isWishlisted) {
        await removeFromWishlist(symbol).unwrap();
        toast.add({
          title: "Removed from Wishlist",
          description: `${symbol} has been removed from your wishlist.`,
        });
      } else {
        await addToWishlist({ symbol, name, exchange }).unwrap();
        toast.add({
          title: "Added to Wishlist",
          description: `${symbol} has been added to your wishlist.`,
          type: "success",
        });
      }
    } catch (error) {
      toast.add({
        title: "Error",
        description: "Failed to update wishlist. Please try again.",
        type: "error",
      });
    }
  };

  return (
    <button
      onClick={toggleWishlist}
      disabled={isLoading}
      className={`p-2 rounded-full transition-colors ${
        isWishlisted
          ? "bg-red-50 dark:bg-red-950/40 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50"
          : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
      } disabled:opacity-50 ${className || ""}`}
      title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
    >
      <HugeiconsIcon 
        icon={HeartIcon} 
        size={size} 
        className={isWishlisted ? "text-red-500 fill-current" : ""}
      />
    </button>
  );
}
