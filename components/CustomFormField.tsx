import { StyleSheet, View, TouchableOpacity, Text } from 'react-native'
import React from 'react'
import { TextInput } from 'react-native'
import { Image } from 'react-native'

interface FormFieldProps {
  title: string;
  value: string;
  handleChangeText: (text: string) => void;
  otherStyles?: boolean;
  marginTop?: number;
  marginBottom?: number;
  isPassword?: boolean;
}

const FormField: React.FC<FormFieldProps> = ({ title, value, handleChangeText, otherStyles, marginBottom = 0, marginTop = 0, isPassword = false }) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);

  return (
    <View style={{ marginBottom, marginTop }}>
      <Text className='text-base text-gray-100 font-pmedium'>{title}</Text>
      <View className='flex-row items-center'>
        <View className='flex-row items-center' style={[
          styles.input,
          isFocused ? styles.focused : styles.default,
          otherStyles ? styles.otherStyles : null
        ]}>
          <TextInput
            value={value}
            onChangeText={handleChangeText}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={title.toLowerCase()}
            placeholderTextColor="#888"
            secureTextEntry={isPassword && !isPasswordVisible}
            style={styles.inputText}
          />
          {isPassword && (
            <TouchableOpacity
              onPress={() => setIsPasswordVisible(!isPasswordVisible)}
              className='p-2'
            >
              <Image
                source={isPasswordVisible ? require('@/assets/images/hide.png') : require('@/assets/images/show.png')}
                style={styles.toggleIcon}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  )
}

export default FormField

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  inputText: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    padding: 12,
  },
  focused: {
    backgroundColor: '#333',
    borderColor: '#666',
  },
  default: {
    backgroundColor: '#1a1a1a',
  },
  otherStyles: {
    backgroundColor: '#2a2a2a',
  },
  toggleIcon: {
    width: 20,
    height: 20,
  }
})