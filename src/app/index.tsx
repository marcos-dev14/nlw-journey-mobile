import { useEffect, useState } from "react";
import { Alert, Image, Keyboard, Text, View } from "react-native";
import { MapPin, Calendar as IconCalendar, Settings2, UserRoundPlus, ArrowRight, AtSign } from "lucide-react-native"
import { DateData } from "react-native-calendars";
import { router } from "expo-router";
import dayjs from "dayjs";

import { colors } from "@/styles/colors"

import { DatesSelected, calendarUtils } from "@/utils/calendarUtils"
import { validateInput } from "@/utils/validateInput";
import { tripStorage } from "@/storage/trip";
import { tripServer } from "@/server/trip-server";

import { Input } from "@/components/input";
import { Button } from "@/components/button";
import { Modal } from "@/components/modal"
import { Calendar } from "@/components/calendar";
import { GuestEmail } from "@/components/email";
import { Loading } from "@/components/loading";

enum StepFrom {
  TRIP_DETAILS = 1,
  ADD_EMAIL = 2,
}

enum ModalState {
  NONE = 0,
  CALENDAR = 1,
  GUEST = 2
}

export default function Index() {
  const [isCreatingTrip, setIsCreatingTrip] = useState(false)
  const [isGettingTrip, setIsGettingTrip] = useState(true)
  const [destination, setDestination] = useState("")
  const [stepForm, setStepForm] = useState(StepFrom.TRIP_DETAILS)
  const [selectedDates, setSelectedDates] = useState({} as DatesSelected)
  const [emailToInvite, setEmailToInvite] = useState("")
  const [emailsToInvite, setEmailsToInvite] = useState<string[]>([])

  const [modalVisible, setModalVisible] = useState(ModalState.NONE)

  function handleNextStepForm() {
    if (
      destination.trim().length === 0 ||
      !selectedDates.startsAt ||
      !selectedDates.endsAt
    ) {
      return Alert.alert(
        "Detalhes da viagem",
        "Preencha todas as informações da viagem para seguir."
      )
    }

    if (destination.trim().length < 4) {
      return Alert.alert(
        "Detalhes da viagem",
        "O destino deve ter pelo menos 4 caracteres."
      )
    }

    if (stepForm === StepFrom.TRIP_DETAILS) {
      return setStepForm(StepFrom.ADD_EMAIL)
    }

    Alert.alert("Nova viagem", "Confirmar viagem?", [
      {
        text: "Não",
        style: "cancel",
      },
      {
        text: "Sim",
        onPress: createTrip
      }
    ])
  }

  function handleSelectDate(selectedDay: DateData) {
    const dates = calendarUtils.orderStartsAtAndEndsAt({
      startsAt: selectedDates.startsAt,
      endsAt: selectedDates.endsAt,
      selectedDay,
    })

    setSelectedDates(dates)
  }

  function handleRemoveEmails(emailToRemove: string) {
    setEmailsToInvite((prevState) => 
      prevState.filter((email) => email !== emailToRemove)
    )
  }

  function handleAddEmail() {
    if (!validateInput.email(emailToInvite)) {
      return Alert.alert(
        "Convidado",
        "Por favor, digite um e-mail válido."
      )
    }

    const emailAlreadyExists = emailsToInvite.find(
      (email) => email === emailToInvite
    )

    if (emailAlreadyExists) {
      return Alert.alert(
        "Convidado",
        "Este e-mail já está convidado."
      )
    }

    setEmailsToInvite((prevState) => [...prevState, emailToInvite])
    setEmailToInvite("")
  }

  async function saveTrip(tripId: string) {
    try {
      await tripStorage.save(tripId)

      router.navigate(`/trip/${tripId}`)
    } catch (error) {
      Alert.alert(
        "Salvar viagem",
        "Ocorreu um erro ao salvar a viagem. Tente novamente."
      )

      console.log(error)
    }
  }

  async function createTrip() {
    try {
      setIsCreatingTrip(true)

      const newTrip = await tripServer.create({
        destination,
        starts_at: dayjs(selectedDates.startsAt?.dateString).toString(),
        ends_at: dayjs(selectedDates.endsAt?.dateString).toString(),
        emails_to_invite: emailsToInvite,
      })

      Alert.alert("Nova viagem", "Viagem criada com sucesso!", [
        {
          text: "OK. Continuar.",
          onPress: () => saveTrip(newTrip.tripId),
        },
      ])
    } catch (error) {
      console.log(error)
      setIsCreatingTrip(false)
    }
  }

  async function getTrip() {
    try {
      const tripID = await tripStorage.get()

      if (!tripID) {
        return setIsGettingTrip(false)
      }

      const trip = await tripServer.getById(tripID)

      if (trip) {
        return router.navigate(`/trip/${trip.id}`)
      }
    } catch (error) {
      setIsGettingTrip(false)
      console.log(error)
    }
  }
  
  useEffect(() => {
    getTrip()
  },[])

  if(isGettingTrip) {
    return <Loading />
  }

  return (
    <View className="flex-1 items-center justify-center px-5 relative">
      <Image 
        source={require('@/assets/logo.png')}
        className="h-8"
        resizeMode="contain"
      />

      <Image source={require('@/assets/bg.png')} className="absolute" />

      <Text className="text-zinc-400 font-regular text-center text-lg mt-3">
        Convide seus amigos e planeje sua{"\n"} próxima viagem!
      </Text>

      <View
        className="w-full bg-zinc-900 p-4 rounded-xl my-8 border border-zinc-800"
      >
        <Input>
          <MapPin color={colors.zinc[400]} size={20} />
          <Input.Field 
            value={destination}
            onChangeText={setDestination}
            placeholder="Para onde?"
            editable={stepForm === StepFrom.TRIP_DETAILS}
          />
        </Input>

        <Input>
          <IconCalendar color={colors.zinc[400]} size={20} />
          <Input.Field 
            value={selectedDates.formatDatesInText}
            placeholder="Quando?" 
            editable={stepForm === StepFrom.TRIP_DETAILS}
            onFocus={() => Keyboard.dismiss()}
            showSoftInputOnFocus={false}
            onPressIn={() =>
              stepForm === StepFrom.TRIP_DETAILS && setModalVisible(ModalState.CALENDAR)
            }
          />
        </Input>

        {stepForm === StepFrom.ADD_EMAIL && (
          <View className="py-3 border-b border-zinc-800">
            <Button 
              variant="secondary"
              onPress={() => setStepForm(StepFrom.TRIP_DETAILS)}
            >
              <Button.Title>
                Alterar local/data
              </Button.Title>
              <Settings2 color={colors.zinc[200]} size={20} />
            </Button>

            <Input>
              <UserRoundPlus color={colors.zinc[400]} size={20} />
              <Input.Field 
                placeholder="Quem estará na viagem?" 
                autoCorrect={false}
                value={
                  emailsToInvite.length > 0 
                  ? `${emailsToInvite.length} pessoas(a) convidada(s)`
                  : ""
                }
                onPress={() => {
                  Keyboard.dismiss()
                  setModalVisible(ModalState.GUEST)
                }}
                showSoftInputOnFocus={false}
              />
            </Input>
          </View>
        )}

        <Button onPress={handleNextStepForm} isLoading={isCreatingTrip}>
            <Button.Title>
              {stepForm === StepFrom.TRIP_DETAILS
                ? "Continuar"
                : "Confirmar email" 
              }
            </Button.Title>
            <ArrowRight color={colors.lime[950]} size={20} />
          </Button>
      </View>

      <Text className="text-zinc-500 font-regular text-center text-base">
        Ao planejar sua viagem pela plann.er você automaticamente concorda com
        nossos{" "}
        <Text className="text-zinc-300 underline">
          termos de uso e políticas de privacidade
        </Text>
      </Text>

      <Modal
        title="Selecionar datas"
        subtitle="Selecione a data de ida e volta da viagem"
        visible={modalVisible === ModalState.CALENDAR}
        onClose={() => setModalVisible(ModalState.NONE)}
      >
        <View className="gap-4 mt-4">
          <Calendar 
          minDate={dayjs().toISOString()}
            onDayPress={handleSelectDate}
            markedDates={selectedDates.dates}
          />

          <Button onPress={() => setModalVisible(ModalState.NONE)}>
            <Button.Title>Confirmar</Button.Title>
          </Button>
        </View>
      </Modal>

      <Modal
        title="Selecionar os convidados"
        subtitle="Os convidados irão receber e-mails para confirmar a participação
          na viagem
        "
        visible={modalVisible === ModalState.GUEST}
        onClose={() => setModalVisible(ModalState.NONE)}
      >
        <View
          className="my-2 flex-wrap gap-2 border-b border-zinc-800 py-5 items-start"
        >
          {emailsToInvite.length > 0 ? (
            emailsToInvite.map((email) => (
              <GuestEmail 
                key={email}
                email={email} 
                onRemove={() => handleRemoveEmails(email)} 
              />
            ))
          ) : (
            <Text className="text-zinc-600 font-regular text-base">
              Nenhum convidado adicionado
            </Text>
          )}
          
        </View>

        <View className="gap-4 mt-4">
          <Input variant="secondary">
              <AtSign color={colors.zinc[400]} size={20} />
              <Input.Field
                value={emailToInvite} 
                onChangeText={(text) => setEmailToInvite(text.toLowerCase())}
                placeholder="Digite o e-mail do convidado"
                keyboardType="email-address"
                returnKeyType="send"
                onSubmitEditing={handleAddEmail}
              />
          </Input>

          <Button onPress={handleAddEmail}>
            <Button.Title>Adicionar convidado</Button.Title>
          </Button>
        </View>
      </Modal>
    </View>
  )
}