import { View, Text, TouchableOpacity, Keyboard, Alert } from "react-native";

import { TripDetails, tripServer } from "@/server/trip-server"
import { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Loading } from "@/components/loading";
import { Input } from "@/components/input";
import { Calendar as IconCalendar, CalendarRange, Info, MapPin, Settings2 } from "lucide-react-native";
import { colors } from "@/styles/colors";
import dayjs from "dayjs";
import { Button } from "@/components/button";
import { Activities } from "./activities";
import { Details } from "./details";
import { Modal } from "@/components/modal";
import { Calendar } from "@/components/calendar";
import { DateData } from "react-native-calendars";
import { DatesSelected, calendarUtils } from "@/utils/calendarUtils";

export type TripData = TripDetails & { when: string }

enum ModalState {
  NONE = 0,
  CALENDAR = 1,
  UPDATE_TRIP = 2,
}
export default function Trip() {
  const [isLoadingTrip, setIsLoadingTrip] = useState(false)
  const [isUpdatingTrip, setIsUpdatingTrip] = useState(false)
  const [tripDetails, setTripDetails] = useState({} as TripData)
  const [option, setOption] = useState<"activity" | "details">("activity")
  const [modalVisible, setModalVisible] = useState(ModalState.NONE)
  const [destination, setDestination] = useState("")
  const [selectedDates, setSelectedDates] = useState({} as DatesSelected)

  const tripId = useLocalSearchParams<{ id: string }>().id

  function handleSelectDate(selectedDay: DateData) {
    const dates = calendarUtils.orderStartsAtAndEndsAt({
      startsAt: selectedDates.startsAt,
      endsAt: selectedDates.endsAt,
      selectedDay,
    })

    setSelectedDates(dates)
  }

  async function getTripDetails() {
    try {
      setIsLoadingTrip(true)
      
      if (!tripId) {
        return router.back()
      }

      const trip = await tripServer.getById(tripId)

      const maxLengthDestination = 14
      const destination = trip.destination.length > maxLengthDestination
        ? trip.destination.slice(0, maxLengthDestination) + "..."
        : trip.destination

      const starts_at = dayjs(trip.starts_at).format("DD")
      const ends_at = dayjs(trip.ends_at).format("DD")
      const month = dayjs(trip.starts_at).format("MMM")

      setDestination(trip.destination)

      setTripDetails({
       ...trip,
        when: `${destination} de ${starts_at} à ${ends_at} de ${month}`
      })

    } catch (error) {
      console.error(error)
    } finally {
      setIsLoadingTrip(false)
    }
  }

  async function handleUpdateTrip() {
    try {
      if (!tripId) {
        return
      }

      if (!destination || !selectedDates.startsAt || !selectedDates.endsAt) {
        return Alert.alert(
          "Atualizar viagem",
          "Lembre-se de, além de preencher o destino, selecionar data de início e fim da viagem."
        )
      }

      setIsUpdatingTrip(true)

      await tripServer.update({
        id: tripId,
        destination,
        starts_at: dayjs(selectedDates.startsAt.dateString).toString(),
        ends_at: dayjs(selectedDates.endsAt.dateString).toString(),
      })

      Alert.alert("Atualizar viagem", "Viagem atualizada com sucesso!", [
        {
          text: "Ok", 
          onPress: () => {
            setModalVisible(ModalState.NONE)
            getTripDetails()
          } 
        }
      ])
    } catch (error) {
      console.error(error)
    } finally {
      setIsUpdatingTrip(false)
    }
  }

  useEffect(() => {
    getTripDetails()
  }, [])

  if (isLoadingTrip) {
    return <Loading />
  }

  return (
    <View className="flex-1 px-5 pt-16">
      <Input variant="tertiary">
        <MapPin color={colors.zinc[400]} size={20} />
        <Input.Field value={tripDetails.when} />

        <TouchableOpacity
          activeOpacity={0.6}
          className="w-9 h-9 bg-zinc-800 items-center justify-center rounded"
          onPress={() => setModalVisible(ModalState.UPDATE_TRIP)}
        >
          <Settings2 color={colors.zinc[400]} size={20} />
        </TouchableOpacity>
      </Input>

      {option === "activity" 
        ? <Activities tripDetails={tripDetails} /> 
        : <Details tripId={tripDetails.id} />
      }

      <View className="w-full absolute -bottom-1 self-center justify-end pb-5 z-10 bg-zinc-950">
        <View className="w-full flex-row bg-zinc-900 p-4 rounded-lg border border-zinc-800 gap-2">
          <Button 
            className="flex-1 w-[159]"
            onPress={() => setOption("activity")}  
            variant={option === "activity" ? "primary" : "secondary"}
          >
            <CalendarRange 
              color={
                option === "activity" 
                  ? colors.lime[950] 
                  : colors.zinc[200]
              }
              size={20}
            />
            <Button.Title>Atividades</Button.Title>
          </Button>

          <Button 
            className="flex-1 w-[159]"
            onPress={() => setOption("details")}  
            variant={option === "details" ? "primary" : "secondary"}
          >
             <Info 
              color={
                option === "details" 
                  ? colors.lime[950] 
                  : colors.zinc[200]
              }
              size={20}
            />
            <Button.Title>Detalhes</Button.Title>
          </Button>
        </View>
      </View>

      <Modal
        title="Atualizar viagem"
        subtitle="Somente quem criou a viagem pode editar."
        visible={modalVisible === ModalState.UPDATE_TRIP}
        onClose={() => setModalVisible(ModalState.NONE)}
      >
        <View className="gap-2 my-4">
          <Input variant="secondary">
            <MapPin color={colors.zinc[400]} size={20} />
            <Input.Field 
              value={destination}
              onChangeText={setDestination}
              placeholder="Para onde?"
            />
          </Input>

          <Input variant="secondary">
            <IconCalendar color={colors.zinc[400]} size={20} />
            <Input.Field 
              value={selectedDates.formatDatesInText}
              placeholder="Quando?"
              onPress={() => setModalVisible(ModalState.CALENDAR)}
              onFocus={() => Keyboard.dismiss()}
            />
          </Input>
        </View>

        <Button onPress={handleUpdateTrip} isLoading={isUpdatingTrip}>
          <Button.Title>Atualizar</Button.Title>
        </Button>
      </Modal>

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

          <Button onPress={() => setModalVisible(ModalState.UPDATE_TRIP)}>
            <Button.Title>Confirmar</Button.Title>
          </Button>
        </View>
      </Modal>
    </View>
  )
}