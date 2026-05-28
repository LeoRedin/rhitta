import { useEffect, useRef } from "react";
import { Animated, Text, View } from "react-native";
import { FALLBACK_COLORS } from "../theme/themed.js";

export type ToastVariant = "success" | "error" | "info";

export type ToastProps = {
	title: string;
	description?: string;
	variant?: ToastVariant;
	duration?: number;
	onDismiss: () => void;
};

const VARIANT_STYLES: Record<
	ToastVariant,
	{ backgroundColor: string; icon: string }
> = {
	success: { backgroundColor: FALLBACK_COLORS.success, icon: "✓" },
	error: { backgroundColor: FALLBACK_COLORS.error, icon: "✗" },
	info: { backgroundColor: FALLBACK_COLORS.info, icon: "ℹ" },
};

const DEFAULT_DURATION = 4000;

export function Toast({
	title,
	description,
	variant = "info",
	duration = DEFAULT_DURATION,
	onDismiss,
}: ToastProps) {
	const opacity = useRef(new Animated.Value(0)).current;
	const variantStyle = VARIANT_STYLES[variant];

	useEffect(() => {
		Animated.sequence([
			Animated.timing(opacity, {
				toValue: 1,
				duration: 200,
				useNativeDriver: true,
			}),
			Animated.delay(duration),
			Animated.timing(opacity, {
				toValue: 0,
				duration: 200,
				useNativeDriver: true,
			}),
		]).start(() => {
			onDismiss();
		});
	}, [opacity, duration, onDismiss]);

	return (
		<Animated.View
			style={{
				position: "absolute",
				top: 60,
				left: 16,
				right: 16,
				flexDirection: "row",
				alignItems: "center",
				gap: 12,
				backgroundColor: FALLBACK_COLORS.surface,
				borderRadius: 8,
				borderWidth: 1,
				borderColor: FALLBACK_COLORS.border,
				padding: 16,
				shadowColor: "#000",
				shadowOffset: { width: 0, height: 2 },
				shadowOpacity: 0.1,
				shadowRadius: 8,
				elevation: 4,
				opacity,
				zIndex: 9999,
			}}
			role="alert"
			aria-live="assertive"
		>
			<View
				style={{
					width: 24,
					height: 24,
					borderRadius: 12,
					backgroundColor: variantStyle.backgroundColor,
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				<Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "700" }}>
					{variantStyle.icon}
				</Text>
			</View>
			<View style={{ flex: 1, gap: 2 }}>
				<Text
					style={{
						fontSize: 14,
						fontWeight: "600",
						color: FALLBACK_COLORS.text,
					}}
				>
					{title}
				</Text>
				{description && (
					<Text
						style={{
							fontSize: 12,
							color: FALLBACK_COLORS.text,
							opacity: 0.7,
						}}
					>
						{description}
					</Text>
				)}
			</View>
		</Animated.View>
	);
}

/**
 * ToastHost — mount once in your root layout to render active toasts.
 */
export type ToastHostProps = {
	toasts: Array<{
		id: string;
		title: string;
		description?: string;
		variant?: ToastVariant;
	}>;
	onDismiss: (id: string) => void;
};

export function ToastHost({ toasts, onDismiss }: ToastHostProps) {
	return (
		<View
			style={{
				position: "absolute",
				top: 0,
				left: 0,
				right: 0,
				zIndex: 9999,
				pointerEvents: "box-none",
			}}
		>
			{toasts.map((toast) => (
				<Toast
					key={toast.id}
					title={toast.title}
					description={toast.description}
					variant={toast.variant}
					onDismiss={() => onDismiss(toast.id)}
				/>
			))}
		</View>
	);
}
