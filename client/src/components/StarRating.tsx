import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number | string;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
}

export function StarRating({ rating, size = "md", showValue = false }: StarRatingProps) {
  const ratingNum = typeof rating === "string" ? parseFloat(rating) : rating;
  const clampedRating = Math.min(Math.max(ratingNum, 0), 5);

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const fullStars = Math.floor(clampedRating);
  const hasHalfStar = clampedRating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-0.5">
        {/* Estrelas cheias */}
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star
            key={`full-${i}`}
            className={`${sizeClasses[size]} fill-yellow-400 text-yellow-400`}
          />
        ))}

        {/* Meia estrela */}
        {hasHalfStar && (
          <div className="relative w-5 h-5">
            <Star className={`${sizeClasses[size]} text-gray-300 absolute`} />
            <div className="overflow-hidden w-2.5">
              <Star className={`${sizeClasses[size]} fill-yellow-400 text-yellow-400`} />
            </div>
          </div>
        )}

        {/* Estrelas vazias */}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star
            key={`empty-${i}`}
            className={`${sizeClasses[size]} text-gray-300`}
          />
        ))}
      </div>

      {showValue && (
        <span className="text-sm font-medium text-gray-600 ml-1">
          {clampedRating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
