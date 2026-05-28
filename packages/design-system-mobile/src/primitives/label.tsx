import type { ReactNode } from "react";
import { Text } from "react-native";
import { FALLBACK_COLORS } from "../theme/themed.js";

export type LabelProps = {
	children: ReactNode;
	htmlFor?: string;
};

export function Label({ children, htmlFor }: LabelProps) {
	return (
		<Text
			accessibilityLabel={htmlFor}
			style={{
				fontSize: 14,
				fontWeight: "500",
				color: FALLBACK_COLORS.text,
				lineHeight: 20,
			}}
		>
			{children}
		</Text>
	);
}
