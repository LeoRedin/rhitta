import type { ReactNode } from "react";
import { View, type ViewStyle } from "react-native";
import { FALLBACK_COLORS } from "../theme/themed.js";

export type CardProps = {
	children: ReactNode;
	style?: ViewStyle;
};

export function Card({ children, style }: CardProps) {
	return (
		<View
			style={{
				borderRadius: 8,
				borderWidth: 1,
				borderColor: FALLBACK_COLORS.border,
				backgroundColor: FALLBACK_COLORS.surface,
				padding: 24,
				...style,
			}}
		>
			{children}
		</View>
	);
}
