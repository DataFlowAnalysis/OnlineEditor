<script setup lang="ts">
import filePicker from 'vue-file-picker'
import type {BDropdown, TableField } from 'bootstrap-vue-next'
import { BTable } from 'bootstrap-vue-next'
import { sendMessage } from './components/webSocketHandler'
import {createListOfModelsFromFiles} from './components/fileHandler'
import { Model } from './components/model'
import { ref } from 'vue'

var userHasPickedNoFiles: true;
var modelsReceived: Model[]= [];

function convertToMetamodel(event: MouseEvent) {
  alert(`Converting to metamodel. Pls allow multiple downloads!`);  
  sendMessage(true, modelsReceived);
  modelsReceived = [];
  modelRows.value = []
}

function convertToJson(event: MouseEvent) {
  console.log(modelsReceived != null);
  sendMessage(false, modelsReceived);
  modelsReceived = [];
  modelRows.value = []
}

function fileAdded(fileList: File[]) {
  console.log('vfp:', fileList);
  const newModels = createListOfModelsFromFiles(Array.from(fileList));
  modelsReceived.push(...newModels);
  newModels.forEach(model => {
    var type = model.getType();
    console.log(type);
    modelRows.value.push({
      name: model.getName(),
      modelType: type,
      status: model.isValid() ? '✅ Ready' : '⚠️ Invalid'
    })
  });
}

// 1) our reactive “rows” that back the table
interface ModelRow {
  name: string
  modelType: string
  status: string
}
const modelRows = ref<ModelRow[]>([])

// 2) define the 3 columns (keys must match the row props)
const tableFields: TableField[] = [
  { key: 'name',      label: 'Model Name'  },
  { key: 'modelType', label: 'Model Type' },
  { key: 'status',    label: 'Valid?'      },
]

</script>

<template>
  <div class="container py-4">
    <!-- HEADER -->
    <div class="text-center mb-4">
      <a
        href="https://github.com/DataFlowAnalysis"
        target="_blank"
        rel="noopener"
      >
        <img
          src="./assets/512x512.png"
          alt="DataFlowAnalysis logo"
          class="rounded-circle mb-3"
          width="125"
          height="125"
        />
      </a>
      <h1>DataFlowAnalysis Converter</h1>
    </div>

    <!-- FILE PICKER -->
    <div class="row mb-4">
      <div class="col">
        <file-picker
          id="filePicker"
          @vfp-file-added="fileAdded"
          :allow-multiple="true"
        > <template #label>
            Drop or pick files to add to conversion list.
          </template>
        </file-picker>
      </div>
    </div>

    <!-- dynamic table -->
    <div class="row">
      <div class="col">
        <b-table
          :items="modelRows"
          :fields="tableFields"
          striped
          hover
          responsive="sm"
          small
          head-variant="light"
        />
      </div>
    </div>

    <!-- ACTION DROPDOWN -->
    <div class="row">
      <div class="col d-flex justify-content-center">
        <BDropdown
          variant="primary"
          text="Download Model As"
        >
          <BDropdownItemButton @click="convertToJson">
            JSON
          </BDropdownItemButton>
          <BDropdownItemButton @click="convertToMetamodel">
            ECore Metamodel
          </BDropdownItemButton>
        </BDropdown>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
