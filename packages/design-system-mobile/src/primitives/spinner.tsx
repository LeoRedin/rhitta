import { ActivityIndicator, View } from "react-native";
import { FALLBACK_COLORS } from "../theme/themed.js";

export type SpinnerSize = "sm" | "md" | "lg";

export type SpinnerProps = {
	size?: SpinnerSize;
};

const SIZE_MAP: Record<SpinnerSize, number> = {
	sm: 16,
	md: 24,
	lg: 32,
};

export function Spinner({ size = "md" }: SpinnerProps) {
	const pixelSize = SIZE_MAP[size];

	return (
		<View
			role="status"
			aria-label="Loading"
			aria-live="polite"
			style={{
				width: pixelSize,
				height: pixelSize,
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			<ActivityIndicator size={pixelSize} color={FALLBACK_COLORS.primary} />
		</View>
	);
}
