(ns hedgehog.todos
  (:use-macros
   ;;[reflex.macros :only [computed-observable constrain!]]
   [hedgehog.macros :only [defo defco]])
  (:require
   [clojure.browser.dom :as dom]
   [clojure.browser.event :as event]
   [reflex.core :as reflex]
   [hedgehog.core :as hedgehog]))

(defo todos ["buy milk" "eat lunch" "drink milk"])
(defo pending-todo "foo bar")

(defco first-todo (first @todos))
(defco num-todos (count @todos))

(defco state {:todos @todos
              :pending-todo @pending-todo})

;; CO example: (computed-observable (if @a @b @c))

(defn add-todo! [todo]
  (swap! state update-in [:todos] conj todo))

(defn todo-element [todo]
  [:li.todo todo])

(defn todos [state]
  [:div#todos
    [:ul (map todo-element (:todos state))]
    [:input#input
      {:value (:pending-todo state)
       :type "text"
       :autofocus "true"}]
   [:button "Add" (comment {:mouse-event add-todo!})]
   [:span (:pending-todo state)]])

(defn title [state]
  (str "Todos" (when-not (zero? @num-todos) (str " (" @num-todos ")"))))

(defn input-event
  "too specific"
  [ev]
  (let [val (-> ev .-target .-value)]
    (swap! state assoc :pending-todo val)))

(hedgehog/dom-ready!
 (fn []
  (hedgehog/init! todos title state)
  (event/listen (hedgehog/body) :input input-event true)))