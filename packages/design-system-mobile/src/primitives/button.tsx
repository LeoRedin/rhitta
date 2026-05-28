import type { ReactNode } from "react";
import {
	ActivityIndicator,
	type GestureResponderEvent,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { FALLBACK_COLORS } from "../theme/themed.js";

export type ButtonVariant = "solid" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = {
	variant?: ButtonVariant;
	size?: ButtonSize;
	disabled?: boolean;
	loading?: boolean;
	onPress: (event: GestureResponderEvent) => void;
	children: ReactNode;
};

const SIZE_STYLES: Record<
	ButtonSize,
	{ height: number; paddingHorizontal: number; fontSize: number }
> = {
	sm: { height: 32, paddingHorizontal: 12, fontSize: 13 },
	md: { height: 40, paddingHorizontal: 16, fontSize: 15 },
	lg: { height: 48, paddingHorizontal: 24, fontSize: 17 },
};

function getVariantStyles(variant: ButtonVariant, disabled: boolean) {
	switch (variant) {
		case "solid":
			return {
				backgroundColor: disabled
					? FALLBACK_COLORS.border
					: FALLBACK_COLORS.primary,
				borderWidth: 0,
			};
		case "outline":
			return {
				backgroundColor: "transparent",
				borderWidth: 1,
				borderColor: disabled
					? FALLBACK_COLORS.border
					: FALLBACK_COLORS.primary,
			};
		case "ghost":
			return {
				backgroundColor: "transparent",
				borderWidth: 0,
			};
		case "danger":
			return {
				backgroundColor: disabled
					? FALLBACK_COLORS.border
					: FALLBACK_COLORS.error,
				borderWidth: 0,
			};
	}
}

function getTextColor(variant: ButtonVariant, disabled: boolean): string {
	if (disabled && (variant === "solid" || variant === "danger")) {
		return FALLBACK_COLORS.textInverse;
	}
	if (disabled) {
		return FALLBACK_COLORS.border;
	}
	switch (variant) {
		case "solid":
		case "danger":
			return FALLBACK_COLORS.textInverse;
		case "outline":
			return FALLBACK_COLORS.primary;
		case "ghost":
			return FALLBACK_COLORS.text;
	}
}

export function Button({
	variant = "solid",
	size = "md",
	disabled = false,
	loading = false,
	onPress,
	children,
}: ButtonProps) {
	const variantStyle = getVariantStyles(variant, disabled);
	const sizeStyle = SIZE_STYLES[size];
	const textColor = getTextColor(variant, disabled);

	return (
		<TouchableOpacity
			activeOpacity={disabled ? 1 : 0.7}
			onPress={onPress}
			disabled={disabled}
			accessibilityRole="button"
			accessibilityState={{ disabled }}
			style={{
				flexDirection: "row",
				alignItems: "center",
				justifyContent: "center",
				gap: 8,
				borderRadius: 6,
				opacity: disabled ? 0.5 : 1,
				...variantStyle,
				...sizeStyle,
			}}
		>
			{loading && (
				<ActivityIndicator
					size="small"
					color={
						variant === "outline" || variant === "ghost"
							? FALLBACK_COLORS.primary
							: FALLBACK_COLORS.textInverse
					}
				/>
			)}
			{typeof children === "string" ? (
				<Text
					style={{
						color: textColor,
						fontSize: sizeStyle.fontSize,
						fontWeight: "500",
					}}
				>
					{children}
				</Text>
			) : (
				<View>{children}</View>
			)}
		</TouchableOpacity>
	);
}
