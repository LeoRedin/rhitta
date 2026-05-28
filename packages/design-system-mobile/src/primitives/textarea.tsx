import { useRef, useState } from "react";
import {
	type TextInputProps as RNTextInputProps,
	Text,
	TextInput,
	View,
} from "react-native";
import { FALLBACK_COLORS } from "../theme/themed.js";
import { Label } from "./label.js";

export type TextareaProps = {
	value?: string;
	onChangeText?: RNTextInputProps["onChangeText"];
	placeholder?: string;
	error?: string;
	label?: string;
	disabled?: boolean;
	numberOfLines?: number;
};

export function Textarea({
	value,
	onChangeText,
	placeholder,
	error,
	label,
	disabled = false,
	numberOfLines = 4,
}: TextareaProps) {
	const [focused, setFocused] = useState(false);
	const inputRef = useRef<import("react-native").TextInput>(null);

	const borderColor = error
		? FALLBACK_COLORS.error
		: focused
			? FALLBACK_COLORS.primary
			: FALLBACK_COLORS.border;

	return (
		<View style={{ gap: 4 }}>
			{label && <Label>{label}</Label>}
			<TextInput
				ref={inputRef}
				value={value}
				onChangeText={onChangeText}
				placeholder={placeholder}
				placeholderTextColor={FALLBACK_COLORS.border}
				editable={!disabled}
				multiline
				numberOfLines={numberOfLines}
				textAlignVertical="top"
				aria-invalid={error ? "true" : undefined}
				onFocus={() => setFocused(true)}
				onBlur={() => setFocused(false)}
				style={{
					flex: 1,
					width: "100%",
					minHeight: numberOfLines * 20,
					borderWidth: 1,
					borderColor,
					borderRadius: 6,
					paddingHorizontal: 12,
					paddingVertical: 8,
					fontSize: 14,
					color: FALLBACK_COLORS.text,
					backgroundColor: FALLBACK_COLORS.surface,
					opacity: disabled ? 0.5 : 1,
				}}
			/>
			{error && (
				<Text
					style={{
						color: FALLBACK_COLORS.error,
						fontSize: 12,
					}}
				>
					{error}
				</Text>
			)}
		</View>
	);
}
