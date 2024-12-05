import React, { useEffect } from "react";
import { View, StyleSheet, Image, Dimensions, Text, TouchableOpacity } from "react-native";

import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";

export default function AccountCreationConfirmation() {
  const screenDimensions = Dimensions.get("window");
  const { t } = useTranslation();
  const navigation = useNavigation();

 

  const handleLogin = ()=> {
      navigation.navigate("Splash");
  };

  return (
    <View style={styles.container} >
      <Image
        source={require("../../assets/account_creation_pending.png")}
        style={{ width: screenDimensions.width * 0.8, height: undefined, aspectRatio: 1 }}
      />
      <Text style={styles.message}>{t('profile.account_creation_pending')}</Text>
      <Text style={styles.submessage}>{t('profile.account_creation_time')}</Text>
      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.loginButtonText}>{t('common.close')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  message: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  submessage: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: "rgba(12, 25, 47, 1)",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  loginButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});